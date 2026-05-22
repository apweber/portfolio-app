import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompanyDetailClient } from "./CompanyDetailClient";

type Params = { params: Promise<{ id: string }> };

export default async function CompanyDetailPage({ params }: Params) {
  const profile = await requireAuth();
  const { id } = await params;

  const [company, jobs] = await Promise.all([
    prisma.company.findUnique({ where: { id } }),
    prisma.job.findMany({
      where: { companyId: id, userId: profile.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, fitScore: true },
    }),
  ]);

  if (!company) notFound();

  const canEdit = company.createdById === profile.id || profile.role === "ADMIN";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{company.name}</h2>
          {company.industry && <p className="text-sm text-gray-500">{company.industry}</p>}
        </div>
        <Link href="/companies" className="text-sm text-blue-600 hover:underline">
          ← Back
        </Link>
      </div>
      <dl className="grid gap-2 text-sm">
        {company.location && (
          <>
            <dt className="font-medium text-gray-700">Location</dt>
            <dd className="text-gray-500">{company.location}</dd>
          </>
        )}
        {company.size && (
          <>
            <dt className="font-medium text-gray-700">Size</dt>
            <dd className="text-gray-500">{company.size}</dd>
          </>
        )}
        {company.website && (
          <>
            <dt className="font-medium text-gray-700">Website</dt>
            <dd>
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {company.website}
              </a>
            </dd>
          </>
        )}
        {company.cultureNotes && (
          <>
            <dt className="font-medium text-gray-700">Culture Notes</dt>
            <dd className="text-gray-500 whitespace-pre-wrap">{company.cultureNotes}</dd>
          </>
        )}
      </dl>
      {canEdit && (
        <CompanyDetailClient
          companyId={id}
          initialValues={{
            name: company.name,
            industry: company.industry ?? undefined,
            size: company.size ?? undefined,
            location: company.location ?? undefined,
            website: company.website ?? undefined,
            cultureNotes: company.cultureNotes ?? undefined,
          }}
        />
      )}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Your Jobs Here</h3>
          <Link href={`/jobs/new?companyId=${id}`} className="text-sm text-blue-600 hover:underline">
            Add Job
          </Link>
        </div>
        {jobs.length === 0 ? (
          <p className="text-sm text-gray-500">No jobs at this company yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
            {jobs.map((j) => (
              <li key={j.id} className="flex items-center justify-between px-4 py-2">
                <Link href={`/jobs/${j.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                  {j.title}
                </Link>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{j.status}</span>
                  {j.fitScore !== null && <span>{j.fitScore}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
