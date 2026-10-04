import "server-only";
import { getImageModel, getTextModels } from "@/lib/gemini";

/** Nama model aktif, diambil dari .env (GEMINI_TEXT_MODEL, dst). */
export function getAiModelInfo() {
  const [textModel, ...fallbackModels] = getTextModels();
  const imageModel =
    process.env.GEMINI_IMAGE_ENABLED !== "false"
      ? getImageModel()
      : process.env.POLLINATIONS_ENABLED !== "false"
        ? "Pollinations (FLUX)"
        : "cover SVG lokal";
  return { textModel: textModel ?? "-", fallbackModels, imageModel };
}
