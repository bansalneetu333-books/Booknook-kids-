import { BookForm } from "@/components/admin/book-form";

export default function NewBookPage() {
  return (
    <main className="p-5 sm:p-8">
      <h1 className="text-3xl font-black">Add Book</h1>
      <p className="mt-1 text-slate-500">
        Create a draft or publish a new book.
      </p>
      <div className="mt-7 max-w-3xl">
        <BookForm />
      </div>
    </main>
  );
}
