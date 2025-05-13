// src/app/settings/bulk-upload/page.tsx
'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import type { UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { processBulkUpload } from '@/ai/flows/process-bulk-upload-flow'; 
import type { BulkProductEntry } from '@/schemas/productSchemas'; // Updated import path

const allowedRoles: UserRole[] = ['owner', 'admin', 'employee']; 

export default function BulkUploadPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type === 'text/csv' || 
          selectedFile.name.endsWith('.xlsx') || 
          selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV or Excel (.xlsx) file.",
          variant: "destructive",
        });
        setFile(null);
        setFileName(null);
        event.target.value = ""; 
      }
    } else {
      setFile(null);
      setFileName(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "No File Selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    setIsUploading(true);

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer) {
          toast({ title: "File Read Error", description: "Could not read the file.", variant: "destructive" });
          setIsUploading(false);
          return;
        }

        let productsFromFile: BulkProductEntry[] = [];
        const expectedHeaders = ["Name", "SerialNumber", "Barcode", "Price", "Quantity", "CategoryName"];

        if (file.name.endsWith('.xlsx')) {
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
             toast({ title: "Empty File", description: "The Excel file is empty.", variant: "destructive" });
             setIsUploading(false);
             return;
          }
          const headers = jsonData[0] as string[];
          const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
          if (missingHeaders.length > 0) {
            toast({ title: "Missing Headers", description: `Excel file is missing headers: ${missingHeaders.join(', ')}`, variant: "destructive", duration: 7000 });
            setIsUploading(false);
            return;
          }

          productsFromFile = jsonData.slice(1).map(row => ({
            Name: String(row[headers.indexOf("Name")] || ''),
            SerialNumber: String(row[headers.indexOf("SerialNumber")] || ''),
            Barcode: String(row[headers.indexOf("Barcode")] || ''),
            Price: parseFloat(String(row[headers.indexOf("Price")] || 0)),
            Quantity: parseInt(String(row[headers.indexOf("Quantity")] || 0), 10),
            CategoryName: String(row[headers.indexOf("CategoryName")] || ''),
          }));

        } else if (file.type === 'text/csv') {
          const text = new TextDecoder("utf-8").decode(arrayBuffer as ArrayBuffer);
          const result = Papa.parse<any>(text, { header: true, skipEmptyLines: true });
          
          if (result.errors.length > 0) {
             toast({ title: "CSV Parsing Error", description: `Error parsing CSV: ${result.errors[0].message}`, variant: "destructive" });
             setIsUploading(false);
             return;
          }
          if (result.data.length === 0) {
            toast({ title: "Empty File", description: "The CSV file is empty or contains no data rows.", variant: "destructive" });
            setIsUploading(false);
            return;
          }
          
          const headers = result.meta.fields || [];
          const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
          if (missingHeaders.length > 0) {
            toast({ title: "Missing Headers", description: `CSV file is missing headers: ${missingHeaders.join(', ')}`, variant: "destructive", duration: 7000 });
            setIsUploading(false);
            return;
          }

          productsFromFile = result.data.map(row => ({
            Name: String(row.Name || ''),
            SerialNumber: String(row.SerialNumber || ''),
            Barcode: String(row.Barcode || ''),
            Price: parseFloat(String(row.Price || 0)),
            Quantity: parseInt(String(row.Quantity || 0), 10),
            CategoryName: String(row.CategoryName || ''),
          }));
        }

        productsFromFile = productsFromFile.filter(p => p.Name && (p.SerialNumber || p.Barcode) && p.CategoryName); 

        if(productsFromFile.length === 0){
            toast({ title: "No Valid Products", description: "No valid product entries found in the file. Ensure Name, SerialNumber/Barcode, and CategoryName are present.", variant: "destructive", duration: 7000 });
            setIsUploading(false);
            return;
        }


        const flowResult = await processBulkUpload({ products: productsFromFile });

        if (flowResult.errors && flowResult.errors.length > 0) {
            toast({
                title: `Bulk Upload Partially Successful (${flowResult.successCount} / ${productsFromFile.length})`,
                description: (
                  <div>
                    <p>{flowResult.message}</p>
                    {flowResult.newCategoriesCreated && flowResult.newCategoriesCreated.length > 0 && <p>New categories created: {flowResult.newCategoriesCreated.join(', ')}</p>}
                    <p className="font-semibold mt-2">Errors:</p>
                    <ul className="list-disc list-inside max-h-32 overflow-y-auto text-xs">
                      {flowResult.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                      {flowResult.errors.length > 5 && <li>...and {flowResult.errors.length - 5} more.</li>}
                    </ul>
                  </div>
                ),
                variant: "destructive", 
                duration: 10000,
              });
        } else {
            toast({
                title: "Bulk Upload Successful!",
                description: (
                  <div>
                     <p>{flowResult.message} Processed {flowResult.successCount} products.</p>
                     {flowResult.newCategoriesCreated && flowResult.newCategoriesCreated.length > 0 && <p>New categories created: {flowResult.newCategoriesCreated.join(', ')}</p>}
                  </div>
                ),
                className: "bg-green-500 text-white", 
                duration: 7000,
            });
        }

      };

      fileReader.onerror = () => {
        toast({ title: "File Read Error", description: "An error occurred while reading the file.", variant: "destructive" });
        setIsUploading(false);
      };
      
      fileReader.readAsArrayBuffer(file);

    } catch (error) {
      console.error("Error during upload process:", error);
      toast({ title: "Upload Error", description: "An unexpected error occurred during upload.", variant: "destructive" });
    } finally {
      
      const fileInput = document.getElementById('bulk-product-file') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      setFile(null);
      setFileName(null);
      setIsUploading(false);
    }
  };

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <div className="space-y-6">
        <Button variant="outline" size="sm" asChild>
            <Link href="/products">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
            </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Bulk Product Upload</h1>
          <p className="text-muted-foreground">
            Upload an Excel (xlsx) or CSV file containing product information.
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Upload File</CardTitle>
            <CardDescription>
              Ensure your file has columns: <span className="font-semibold">Name, SerialNumber, Barcode, Price, Quantity, CategoryName</span>.
              <br />
              If a CategoryName does not exist, it will be created automatically. Price and Quantity should be numbers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="bulk-product-file">Product File (CSV or XLSX)</Label>
              <Input 
                id="bulk-product-file" 
                type="file" 
                accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {fileName && <p className="text-sm text-muted-foreground mt-1">Selected: {fileName}</p>}
            </div>
            <Button onClick={handleUpload} disabled={!file || isUploading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
              {isUploading ? "Processing..." : "Upload Products"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
