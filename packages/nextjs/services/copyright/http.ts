import { z } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function appOrigin() {
  const url = new URL(process.env.SIWE_ORIGIN || "http://localhost:3000");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new Error("SIWE_ORIGIN must use HTTPS outside localhost");
  }
  return url;
}

export function endpoint(action: (request: Request) => Promise<unknown>) {
  return async (request: Request) => {
    const headers = { "Cache-Control": "no-store" };
    try {
      if (!process.env.DATABASE_URL) throw new ApiError(503, "Chưa cấu hình cơ sở dữ liệu hồ sơ.");
      if (request.method !== "GET" && request.headers.get("origin") !== appOrigin().origin) {
        throw new ApiError(403, "Nguồn yêu cầu không hợp lệ.");
      }
      return Response.json(await action(request), { headers });
    } catch (error) {
      if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status, headers });
      if (error instanceof z.ZodError) {
        const issue = error.issues[0];
        return Response.json(
          { error: "Dữ liệu không hợp lệ. " + [issue?.path.join("."), issue?.message].filter(Boolean).join(" — ") },
          { status: 400, headers },
        );
      }
      console.error("Copyright API:", error instanceof Error ? error.name : "Unknown error");
      return Response.json(
        { error: "Không thể hoàn tất yêu cầu. Kiểm tra cấu hình và thử lại." },
        { status: 503, headers },
      );
    }
  };
}

export async function jsonBody<T>(request: Request, schema: z.ZodType<T>) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new ApiError(415, "Yêu cầu phải dùng JSON.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Thiếu nội dung yêu cầu.");
  const decoder = new TextDecoder();
  let bytes = 0;
  let input = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 16384) {
      await reader.cancel();
      throw new ApiError(413, "Nội dung yêu cầu quá lớn.");
    }
    input += decoder.decode(value, { stream: true });
  }
  let data: unknown;
  try {
    data = JSON.parse(input + decoder.decode());
  } catch {
    throw new ApiError(400, "JSON không hợp lệ.");
  }
  return schema.parse(data);
}
