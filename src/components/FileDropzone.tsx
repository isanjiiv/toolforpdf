import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFiles: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  label?: string;
  hint?: string;
}

const FileDropzone = ({ onFiles, accept, multiple = true, label, hint }: Props) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => onFiles(files),
    accept,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-gradient-hero p-10 text-center transition-smooth",
        isDragActive ? "border-primary bg-accent" : "border-border hover:border-primary/60 hover:bg-accent/40"
      )}
    >
      <input {...getInputProps()} />
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
        <UploadCloud className="h-8 w-8" />
      </div>
      <p className="font-display text-lg font-bold text-foreground">
        {label ?? (isDragActive ? "Drop files here" : "Click or drop files here")}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{hint ?? "Your files stay on your device — nothing is uploaded."}</p>
    </div>
  );
};

export default FileDropzone;
