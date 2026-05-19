export function StorageNote() {
  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
      <p className="font-semibold">
        当前如果未接数据库，上传记录可能只是前端演示或本地浏览器保存。换电脑后可能看不到。
      </p>
      <p className="mt-2">
        后续接入 Supabase 后，原始 Excel 文件会保存到云端文件存储；解析后的表格数据、上传记录、操作记录和周报记录会保存到数据库。
      </p>
    </section>
  );
}
