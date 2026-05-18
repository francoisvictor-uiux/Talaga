import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Label } from "./label";
import { SafeImage } from "./SafeImage";
import { cn } from "./utils";
import { uploadImage } from "../../services/fileService";

type Folder = "customers" | "items" | "packages" | "settings" | "general";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label: string;
  folder: Folder;
  maxSizeMB?: number;
  hint?: string;
}

export function ImageUploader({
  value, onChange, label, folder, maxSizeMB = 2, hint,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`حجم الصورة أكبر من ${maxSizeMB} ميجا`);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err: any) {
      toast.error(err?.message ?? "تعذر رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div
        onClick={() => !uploading && ref.current?.click()}
        className={cn(
          "relative w-full h-28 rounded-xl border-2 border-dashed border-[#d1d5dc] bg-[#f9fafb] flex flex-col items-center justify-center cursor-pointer hover:border-[#155dfc] hover:bg-blue-50/30 transition-all group overflow-hidden",
          uploading && "cursor-wait opacity-70",
        )}
      >
        {uploading ? (
          <Loader2 className="w-7 h-7 text-[#155dfc] animate-spin" />
        ) : value ? (
          <>
            <SafeImage src={value} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Camera className="w-5 h-5 text-white" />
              <span className="text-white text-xs">تغيير الصورة</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="absolute top-2 left-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 z-10"
              title="إزالة الصورة"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <Camera className="w-7 h-7 text-gray-300 mb-1.5 group-hover:text-[#155dfc] transition-colors" />
            <span className="text-xs text-gray-400 group-hover:text-[#155dfc] transition-colors">
              {hint ?? "انقر لرفع صورة"}
            </span>
            <span className="text-[10px] text-gray-300 mt-0.5">PNG · JPG · حتى {maxSizeMB} ميجا</span>
          </>
        )}
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}
