import { imageSize } from "image-size";
import { WEBSITE_MEDIA_MAX_BYTES } from "../domain/src/company-website";
/** Header/dimension validation with structural truncation checks, not full pixel decoding. */
export function inspectWebsiteRaster(bytes: ArrayBuffer) {
  const data = new Uint8Array(bytes);
  if (!data.byteLength || data.byteLength > WEBSITE_MEDIA_MAX_BYTES)
    throw new Error("WEBSITE_MEDIA_SIZE");
  let dimensions;
  try {
    dimensions = imageSize(data);
  } catch {
    throw new Error("WEBSITE_MEDIA_INVALID_IMAGE");
  }
  if (
    !dimensions.width ||
    !dimensions.height ||
    dimensions.width > 10000 ||
    dimensions.height > 10000 ||
    dimensions.width * dimensions.height > 40000000
  )
    throw new Error("WEBSITE_MEDIA_DIMENSIONS");
  const type = dimensions.type;
  if (type !== "png" && type !== "jpg" && type !== "webp")
    throw new Error("WEBSITE_MEDIA_TYPE");
  if (type === "png") {
    const view = new DataView(bytes);
    let position = 8,
      ended = false,
      sawData = false;
    while (position + 12 <= data.length) {
      const length = view.getUint32(position);
      if (length > data.length - position - 12)
        throw new Error("WEBSITE_MEDIA_TRUNCATED");
      const tag = String.fromCharCode(
        ...data.subarray(position + 4, position + 8),
      );
      if (position === 8 && (tag !== "IHDR" || length !== 13))
        throw new Error("WEBSITE_MEDIA_INVALID_IMAGE");
      if (tag === "IDAT") sawData = true;
      position += length + 12;
      if (tag === "IEND") {
        if (length !== 0 || position !== data.length || !sawData)
          throw new Error("WEBSITE_MEDIA_INVALID_IMAGE");
        ended = true;
        break;
      }
    }
    if (!ended) throw new Error("WEBSITE_MEDIA_TRUNCATED");
  } else if (type === "jpg") {
    if (
      data.length < 4 ||
      data[0] !== 255 ||
      data[1] !== 216 ||
      data[data.length - 2] !== 255 ||
      data[data.length - 1] !== 217
    )
      throw new Error("WEBSITE_MEDIA_TRUNCATED");
    let position = 2,
      scan = false;
    while (position < data.length - 2) {
      if (data[position++] !== 255)
        throw new Error("WEBSITE_MEDIA_INVALID_IMAGE");
      while (data[position] === 255) position++;
      const marker = data[position++];
      if (marker === 0 || marker === 216 || marker === 217)
        throw new Error("WEBSITE_MEDIA_INVALID_IMAGE");
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (position + 2 > data.length - 2)
        throw new Error("WEBSITE_MEDIA_TRUNCATED");
      const length = new DataView(bytes).getUint16(position);
      if (length < 2 || position + length > data.length - 2)
        throw new Error("WEBSITE_MEDIA_TRUNCATED");
      position += length;
      if (marker === 218) {
        if (position >= data.length - 2)
          throw new Error("WEBSITE_MEDIA_TRUNCATED");
        scan = true;
        break;
      }
    }
    if (!scan) throw new Error("WEBSITE_MEDIA_INVALID_IMAGE");
  } else {
    if (
      data.length < 20 ||
      new DataView(bytes).getUint32(4, true) + 8 !== data.length
    )
      throw new Error("WEBSITE_MEDIA_TRUNCATED");
    let position = 12;
    let picture = false;
    while (position + 8 <= data.length) {
      const tag = String.fromCharCode(...data.subarray(position, position + 4));
      if (tag === "VP8 " || tag === "VP8L") picture = true;
      if (tag === "ANIM" || tag === "ANMF")
        throw new Error("WEBSITE_MEDIA_TYPE");
      const length = new DataView(bytes).getUint32(position + 4, true);
      position += 8 + length + (length % 2);
      if (position > data.length) throw new Error("WEBSITE_MEDIA_TRUNCATED");
    }
    if (position !== data.length || !picture)
      throw new Error("WEBSITE_MEDIA_TRUNCATED");
  }
  return {
    width: dimensions.width,
    height: dimensions.height,
    contentType: (type === "jpg" ? "image/jpeg" : `image/${type}`) as
      "image/png" | "image/jpeg" | "image/webp",
    size: data.length,
  };
}
