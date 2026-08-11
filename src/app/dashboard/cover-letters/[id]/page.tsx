import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoverLetterEditor } from "@/components/coverletters/cover-letter-editor";
import { deleteCoverLetter } from "@/lib/coverletters/actions";
import { Button } from "@/components/ui/button";

export default async function CoverLetterEditPage({
  params,
}: PageProps<"/dashboard/cover-letters/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: coverLetter } = await supabase
    .from("cover_letters")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!coverLetter) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard/cover-letters" className="text-sm text-indigo-600 hover:underline">
          ← All cover letters
        </Link>
        <form action={deleteCoverLetter.bind(null, coverLetter.id)}>
          <Button type="submit" variant="danger" size="sm">
            Delete
          </Button>
        </form>
      </div>
      <CoverLetterEditor coverLetter={coverLetter} />
    </div>
  );
}
