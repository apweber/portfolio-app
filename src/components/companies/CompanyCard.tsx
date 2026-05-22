import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";

interface Company {
  id: string;
  name: string;
  industry?: string | null;
  location?: string | null;
  size?: string | null;
}

export function CompanyCard({ company }: { company: Company }) {
  return (
    <Link href={`/companies/${company.id}`} className="block hover:shadow-md transition-shadow">
      <Card>
        <CardBody>
          <h3 className="font-semibold text-gray-900">{company.name}</h3>
          {company.industry && <p className="text-sm text-gray-500">{company.industry}</p>}
          {company.location && <p className="text-xs text-gray-400">{company.location}</p>}
          {company.size && <p className="text-xs text-gray-400">{company.size}</p>}
        </CardBody>
      </Card>
    </Link>
  );
}
