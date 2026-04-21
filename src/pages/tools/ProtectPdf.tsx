import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, Loader2, ShieldCheck } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

// Browser PDF AES encryption isn't supported by pdf-lib. We use a clear approach:
// the file is wrapped inside a password-protected ZIP archive, which every OS can open.
// This actually protects the file's contents, unlike fake "PDF locks".

const ProtectPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFiles = (files: File[]) => setFile(files[0] ?? null);

  const protect = async () => {
    if (!file) return;
    if (pwd.length < 4) { toast({ title: "Password too short", description: "Use at least 4 characters." }); return; }
    setBusy(true);
    try {
      // Validate it's a PDF first
      const bytes = new Uint8Array(await file.arrayBuffer());
      await PDFDocument.load(bytes, { ignoreEncryption: true });

      // Use sjcl-style: dynamic import jszip with password — but JSZip doesn't support password.
      // Instead: use the WebCrypto API to AES-GCM encrypt the bytes and bundle in a small HTML decryptor.
      const enc = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const keyMat = await crypto.subtle.importKey("raw", enc.encode(pwd), "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
        keyMat,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"],
      );
      const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);

      // Pack: [salt(16)][iv(12)][ciphertext]
      const packed = new Uint8Array(16 + 12 + ciphertext.byteLength);
      packed.set(salt, 0);
      packed.set(iv, 16);
      packed.set(new Uint8Array(ciphertext), 28);
      const b64 = btoa(String.fromCharCode(...packed));

      const baseName = file.name.replace(/\.pdf$/i, "");
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Locked PDF — ${baseName}</title>
<style>body{font-family:system-ui,sans-serif;background:#fffbe6;display:grid;place-items:center;min-height:100vh;margin:0;color:#222}
.box{background:#fff;border:1px solid #f1d870;border-radius:18px;padding:32px;max-width:420px;width:90%;box-shadow:0 8px 24px rgba(0,0,0,.06);text-align:center}
h1{margin:0 0 4px;font-size:20px}p{color:#666;font-size:14px;margin:8px 0 18px}
input{width:100%;padding:12px 14px;border:1px solid #e6e6e6;border-radius:10px;font-size:15px;box-sizing:border-box}
button{margin-top:12px;background:linear-gradient(135deg,#ffd84d,#ffb800);color:#222;font-weight:700;border:0;padding:12px 18px;border-radius:10px;cursor:pointer;width:100%;font-size:15px}
.err{color:#c00;font-size:13px;margin-top:8px;min-height:18px}</style></head>
<body><div class="box"><h1>🔒 ${baseName}.pdf</h1><p>Enter the password to unlock and download this PDF.</p>
<input id="p" type="password" placeholder="Password" autofocus>
<button onclick="go()">Unlock</button><div class="err" id="e"></div></div>
<script>
const D="${b64}";
async function go(){
  const e=document.getElementById('e');e.textContent='';
  const pwd=document.getElementById('p').value;if(!pwd)return;
  try{
    const raw=Uint8Array.from(atob(D),c=>c.charCodeAt(0));
    const salt=raw.slice(0,16),iv=raw.slice(16,28),ct=raw.slice(28);
    const km=await crypto.subtle.importKey("raw",new TextEncoder().encode(pwd),"PBKDF2",false,["deriveKey"]);
    const k=await crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:200000,hash:"SHA-256"},km,{name:"AES-GCM",length:256},false,["decrypt"]);
    const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv},k,ct);
    const blob=new Blob([pt],{type:"application/pdf"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download="${baseName}.pdf";a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(err){e.textContent='Wrong password.';}
}
document.getElementById('p').addEventListener('keydown',e=>{if(e.key==='Enter')go()});
</script></body></html>`;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = baseName + "-protected.html";
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Protected file ready",
        description: "Share the .html file. Recipient enters the password to download the PDF.",
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed", description: "Make sure the file is a valid PDF.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-accent/40 p-4 text-sm text-accent-foreground">
        <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Strong AES-256 encryption — runs in your browser.</p>
        <p className="mt-1 text-muted-foreground">
          Your PDF is encrypted and packaged into a self-contained password-protected file.
          The recipient opens it in any browser and types the password to download the original PDF.
        </p>
      </div>

      {!file && (
        <FileDropzone onFiles={handleFiles} accept={{ "application/pdf": [".pdf"] }} multiple={false}
          label="Select a PDF to protect" hint="Your file is encrypted locally. Nothing is uploaded." />
      )}

      {file && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">{file.name}</p>
          <div>
            <Label htmlFor="pwd">Password</Label>
            <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="mt-1.5" placeholder="Choose a strong password" />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => { setFile(null); setPwd(""); }} disabled={busy}>Choose another</Button>
            <Button variant="hero" size="lg" onClick={protect} disabled={busy || !pwd}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Encrypting..." : "Protect & download"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtectPdf;
