'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import type { UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import Link from 'next/link';

const allowedRoles: UserRole[] = ['owner'];

export default function BulkUploadPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type === 'text/csv' || 
          selectedFile.name.endsWith('.xlsx') || 
          selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV or Excel (.xlsx) file.",
          variant: "destructive",
        });
        setFile(null);
        event.target.value = ""; // Reset file input
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "No File Selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    // Placeholder for actual upload and processing logic
    // This would involve:
    // 1. Reading the file (e.g., using FileReader and a library like PapaParse for CSV or SheetJS for Excel)
    // 2. Structuring the data
    // 3. Calling a Genkit flow or Firebase function to process and save products
    // 4. Handling responses and errors
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "Upload Initiated (Placeholder)",
      description: `File "${file.name}" is being processed. This is a placeholder action.`,
    });
    console.log("Selected file for upload:", file);
    // Reset file input after "upload"
    setFile(null); 
    // Find a way to reset the input visually if needed, e.g. by keying the input or form.
    // For now, just clearing the state. The HTML input might still show the file name.
    const fileInput = document.getElementById('bulk-product-file') as HTMLInputElement;
    if (fileInput) fileInput.value = "";

    setIsUploading(false);
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
              Ensure your file has columns for: Name, SerialNumber, Barcode, Price, Quantity, CategoryName.
              <br />
              If a CategoryName does not exist, it will be created automatically.
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
              {file && <p className="text-sm text-muted-foreground mt-1">Selected: {file.name}</p>}
            </div>
            <Button onClick={handleUpload} disabled={!file || isUploading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <UploadCloud className="mr-2 h-5 w-5" /> {isUploading ? "Uploading..." : "Upload Products"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
                Note: This is a placeholder. Actual file processing and database updates are not yet implemented.
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
