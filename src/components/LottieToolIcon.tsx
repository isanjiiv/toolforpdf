import { useEffect, useRef, useState } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { ToolCategory } from "@/lib/tools";

/**
 * Maps each tool slug -> a remote Lottie JSON URL (LottieFiles CDN).
 * These are free community animations. We fetch + cache in-memory.
 * On hover the animation plays; otherwise it sits at its first frame.
 */
const LOTTIE_URLS: Record<string, string> = {
  "merge-pdf":         "https://lottie.host/4f6f3c0e-2a6c-4b6a-8f1c-9b6a3a6e9b0a/placeholder.json",
  "split-pdf":         "https://assets10.lottiefiles.com/packages/lf20_jbrw3hcz.json",
  "rotate-pdf":        "https://assets2.lottiefiles.com/packages/lf20_usmfx6bp.json",
  "organize-pdf":      "https://assets9.lottiefiles.com/packages/lf20_yfsb3hbj.json",
  "compress-pdf":      "https://assets3.lottiefiles.com/packages/lf20_kxsd2ytq.json",
  "repair-pdf":        "https://assets1.lottiefiles.com/packages/lf20_q5pk6p1k.json",
  "jpg-to-pdf":        "https://assets5.lottiefiles.com/packages/lf20_GxMZME.json",
  "word-to-pdf":       "https://assets6.lottiefiles.com/packages/lf20_iv4dsx3q.json",
  "powerpoint-to-pdf": "https://assets10.lottiefiles.com/packages/lf20_uwh9wkqi.json",
  "excel-to-pdf":      "https://assets10.lottiefiles.com/packages/lf20_lqfufcmf.json",
  "pdf-to-jpg":        "https://assets3.lottiefiles.com/packages/lf20_bujsx4ek.json",
  "pdf-to-word":       "https://assets6.lottiefiles.com/packages/lf20_iv4dsx3q.json",
  "pdf-to-powerpoint": "https://assets10.lottiefiles.com/packages/lf20_uwh9wkqi.json",
  "pdf-to-excel":      "https://assets10.lottiefiles.com/packages/lf20_lqfufcmf.json",
  "edit-pdf":          "https://assets9.lottiefiles.com/packages/lf20_zw0djhar.json",
  "watermark-pdf":     "https://assets1.lottiefiles.com/packages/lf20_touohxv0.json",
  "protect-pdf":       "https://assets10.lottiefiles.com/packages/lf20_yr6zz3wv.json",
  "unlock-pdf":        "https://assets9.lottiefiles.com/packages/lf20_5tkzkblw.json",
};

const cache = new Map<string, unknown>();

interface Props {
  slug: string;
  category: ToolCategory;
  hovered: boolean;
  className?: string;
}

const LottieToolIcon = ({ slug, hovered, className }: Props) => {
  const url = LOTTIE_URLS[slug];
  const [data, setData] = useState<unknown | null>(() => (url ? (cache.get(url) ?? null) : null));
  const ref = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (!url || data) return;
    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        cache.set(url, json);
        setData(json);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url, data]);

  useEffect(() => {
    const inst = ref.current;
    if (!inst) return;
    if (hovered) {
      inst.goToAndPlay(0, true);
    } else {
      inst.stop();
    }
  }, [hovered, data]);

  if (!data) {
    return (
      <div
        className={`h-full w-full animate-pulse rounded-md bg-current/10 ${className ?? ""}`}
        aria-hidden
      />
    );
  }

  return (
    <Lottie
      lottieRef={ref}
      animationData={data}
      autoplay={false}
      loop={false}
      className={className}
    />
  );
};

export default LottieToolIcon;
