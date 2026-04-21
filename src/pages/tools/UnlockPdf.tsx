import { useState } from "react";
import { Download, Loader2, Unlock } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

// Counterpart to ProtectPdf: accepts the .html "protected" bundle we generate
// (or any base64 packed by the same scheme) and decrypts it using the password.

const UnlockPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFiles = (files: File[]) => setFile(files[0] ?? null);

  const unlock = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const m = text.match(/const D="([A-Za-z0-9+/=]+)"/);
      if (!m) {
        toast({ title: "Unsupported file", description: "Use the .html file produced by Protect PDF.", variant: "destructive" });
        setBusy(false);
        return;
      }
      const raw = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0));
      const salt = raw.slice(0, 16);
      const iv = raw.slice(16, 28);
      const ct = raw.slice(28);
      const km = await crypto.subtle.importKey("raw", new TextEncoder().encode(pwd), "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
        km, { name: "AES-GCM", length: 256 }, false, ["decrypt"],
      );
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
      const blob = new Blob([pt], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.html?$/i, "").replace(/-protected$/i, "") + ".pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Unlocked", description: "Original PDF downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Wrong password", description: "Could not decrypt with that password.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-accent/40 p-4 text-sm text-accent-foreground">
        <p className="flex items-center gap-2 font-semibold"><Unlock className="h-4 w-4" /> For files protected with our Protect PDF tool.</p>
        <p className="mt-1 text-muted-foreground">
          Standard PDF passwords (set in Acrobat/Preview) cannot be removed in-browser without breaking the spec.
          Use this to unlock the .html bundles created by Protect PDF.
        </p>
      </div>

      {!file && (
        <FileDropzone onFiles={handleFiles} accept={{ "text/html": [".html", ".htm"] }} multiple={false}
          label="Select your protected .html file" hint="The file produced by Protect PDF." />
      )}

      {file && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">{file.name}</p>
          <div>
            <Label htmlFor="pwd2">Password</Label>
            <Input id="pwd2" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="mt-1.5" />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => { setFile(null); setPwd(""); }} disabled={busy}>Choose another</Button>
            <Button variant="hero" size="lg" onClick={unlock} disabled={busy || !pwd}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Unlocking..." : "Unlock & download PDF"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnlockPdf;
