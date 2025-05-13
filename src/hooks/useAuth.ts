'use client';
// This file is kept for semantic meaning, but its content is now directly in AuthContext.tsx
// For simplicity and to avoid circular dependencies with AuthContext itself.
// If useAuth needs to grow or have more logic, it can be expanded here.

export { useAuthContext as useAuth } from '@/contexts/AuthContext'; // Updated export
