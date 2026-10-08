import { accents, themes, type FontFamily, type ThemeId } from "./studio-model.ts";

/**
 * "My brand": who the images are from. Stored only in this browser and applied to every image
 * through the byline. Share links and backups never carry it; recipients see their own brand.
 */
export interface BrandKit { name: string; handle: string; avatar: string; accent: string; theme: ThemeId; font: FontFamily }

export const BRAND_KEY = "markdownpic.brand.v1";
export const MAX_AVATAR_LENGTH = 200_000;
export const emptyBrand: BrandKit = { name: "", handle: "", avatar: "", accent: accents[0], theme: "editorial", font: "sans" };

/** A brand kit is "set up" once it says who the images are from. */
export const hasBrand = (brand: BrandKit | null | undefined): brand is BrandKit => Boolean(brand && (brand.name.trim() || brand.handle.trim() || brand.avatar));

export function normalizeBrand(input: unknown): BrandKit {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const text = (key: string, max: number) => typeof value[key] === "string" ? (value[key] as string).replace(/[\r\n\t]+/g, " ").trim().slice(0, max) : "";
  const avatar = typeof value.avatar === "string" && value.avatar.length <= MAX_AVATAR_LENGTH && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value.avatar) ? value.avatar : "";
  const handle = text("handle", 60);
  return {
    name: text("name", 60),
    // Handles read as handles: a leading @ is added unless it is clearly a URL or domain.
    handle: handle && !handle.startsWith("@") && !/[./]/.test(handle) ? "@" + handle : handle,
    avatar,
    accent: typeof value.accent === "string" && /^#[\da-f]{6}$/i.test(value.accent) ? value.accent : emptyBrand.accent,
    theme: themes.some(theme => theme.id === value.theme) ? value.theme as ThemeId : emptyBrand.theme,
    font: ["sans", "serif", "mono"].includes(String(value.font)) ? value.font as FontFamily : emptyBrand.font,
  };
}

export function loadBrand(): BrandKit | null {
  try { const raw = localStorage.getItem(BRAND_KEY); return raw ? normalizeBrand(JSON.parse(raw)) : null; } catch { return null; }
}

export function saveBrand(brand: BrandKit | null) {
  try {
    if (brand && hasBrand(brand)) localStorage.setItem(BRAND_KEY, JSON.stringify(normalizeBrand(brand)));
    else localStorage.removeItem(BRAND_KEY);
    window.dispatchEvent(new Event("markdownpic:brand"));
  } catch { throw new Error("Your browser blocked local storage, so the brand could not be saved."); }
}

/** Center-crops and downsizes an avatar so it stays small enough to keep locally. */
export async function prepareAvatar(file: File, size = 192): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("Use a PNG, JPEG, or WebP image for your avatar.");
  if (file.size > 12_000_000) throw new Error("This image is larger than 12 MB. Choose a smaller avatar.");
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not prepare the avatar.");
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
    let data = canvas.toDataURL("image/webp", .9);
    if (!data.startsWith("data:image/webp")) data = canvas.toDataURL("image/png");
    if (data.length > MAX_AVATAR_LENGTH) data = canvas.toDataURL("image/jpeg", .82);
    return data;
  } finally { bitmap.close(); }
}
