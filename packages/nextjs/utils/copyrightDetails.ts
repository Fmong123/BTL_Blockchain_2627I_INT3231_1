import { z } from "zod";

export const addressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/)
  .transform(value => value.toLowerCase() as Address);
export const hashSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/)
  .transform(value => value.toLowerCase() as Address);
export type Address = `0x${string}`;
export const preparationIdSchema = z.union([hashSchema, z.literal("legacy")]);
const short = z.string().trim().max(120);
const detail = z.string().trim().max(500);
const optionalDate = z.union([z.literal(""), z.iso.date()]);

export function normalizeExperienceUrl(input: string) {
  if (!input) return "";
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return;
    const path = url.pathname.split("/").filter(Boolean);
    if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(url.hostname)) {
      let id: string | null | undefined;
      if (url.hostname === "youtu.be" && path.length === 1) id = path[0];
      else if (url.hostname !== "youtu.be" && url.pathname === "/watch") id = url.searchParams.get("v");
      else if (url.hostname !== "youtu.be" && path.length === 2 && ["shorts", "live"].includes(path[0])) id = path[1];
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return "https://www.youtube.com/watch?v=" + id;
    }
    if (
      url.hostname === "open.spotify.com" &&
      path.length === 2 &&
      ["track", "album", "episode", "show", "playlist"].includes(path[0]) &&
      /^[A-Za-z0-9]{22}$/.test(path[1])
    ) {
      return "https://open.spotify.com/" + path.join("/");
    }
  } catch {
    return;
  }
}

export const profileSchema = z
  .strictObject({
    kind: z.enum(["person", "organization"]),
    name: short.min(1),
    role: short.min(1),
    organizationCode: short,
    website: z.union([z.literal(""), z.url({ protocol: /^https$/ })]).pipe(z.string().max(500)),
    authority: detail,
    isPublic: z.boolean(),
  })
  .refine(p => p.kind !== "organization" || p.authority.length > 0, { message: "Cần nhập căn cứ đại diện." });

export const categories = ["Logo / thiết kế", "Tài liệu", "Sáng tác âm nhạc", "Bản ghi", "Khác"] as const;
const requiredPartyRoles = ["Người sáng tác", "Chủ sở hữu quyền"] as const;
export const partyRoles = [...requiredPartyRoles, "Đại diện / quản lý"] as const;

const workDetailsFields = z.strictObject({
  category: z.enum(categories),
  language: z.string().trim().max(40),
  creationDate: optionalDate,
  publicationDate: optionalDate,
  parties: z
    .array(z.strictObject({ name: short.min(1), role: z.enum(partyRoles) }))
    .min(1)
    .max(12),
  basis: detail.min(1),
  certificate: detail,
  experienceUrl: z
    .string()
    .trim()
    .max(500)
    .transform((value, ctx) => {
      const canonical = normalizeExperienceUrl(value);
      if (canonical !== undefined) return canonical;
      ctx.addIssue({ code: "custom", message: "Dùng liên kết HTTPS hợp lệ của YouTube hoặc Spotify." });
      return z.NEVER;
    }),
});

export const workDetailsSchema = workDetailsFields.superRefine((details, ctx) => {
  const issue = (field: keyof typeof details, message: string) =>
    ctx.addIssue({ code: "custom", path: [field], message });
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  if (!details.creationDate) issue("creationDate", "Nhập ngày hoàn thành / sáng tạo tác phẩm.");
  if (details.creationDate > today) issue("creationDate", "Ngày sáng tạo không được ở tương lai.");
  if (details.publicationDate > today) issue("publicationDate", "Ngày công bố không được ở tương lai.");
  if (details.publicationDate && details.publicationDate < details.creationDate)
    issue("publicationDate", "Ngày công bố phải từ ngày hoàn thành tác phẩm trở đi.");
  if (!requiredPartyRoles.every(role => details.parties.some(party => party.role === role)))
    issue("parties", "Khai đủ người sáng tác và chủ sở hữu quyền; có thể là cùng một người.");
});

export type Profile = z.infer<typeof profileSchema>;
export type WorkDetails = z.infer<typeof workDetailsSchema>;

export const registrationSchema = z.strictObject({
  fileHash: hashSchema,
  title: z
    .string()
    .trim()
    .min(1, "Nhập tên tác phẩm.")
    .refine(value => new TextEncoder().encode(value).length <= 256, "Tên tác phẩm quá dài."),
  description: z
    .string()
    .trim()
    .min(1, "Nhập tóm tắt nội dung tác phẩm.")
    .refine(value => new TextEncoder().encode(value).length <= 2048, "Tóm tắt quá dài."),
  workType: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  details: workDetailsSchema,
  rightsConfirmed: z.literal(true, { error: "Cần xác nhận thẩm quyền và trách nhiệm kê khai." }),
  publicConfirmed: z.literal(true, { error: "Cần xác nhận phạm vi công khai thông tin." }),
});

export type Registration = z.infer<typeof registrationSchema>;
