"use client";
import { useState, useEffect } from "react";
import { get, patch } from "@/lib/api";
import { UserTable } from "@/components/admin/UserTable";
import { useToast } from "@/components/providers/ToastProvider";
import { Skeleton } from "@/components/ui/Skeleton";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const { show } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<{ items: User[] }>("/api/admin/users")
      .then((r) => setUsers(r.items))
      .catch(() => show({ variant: "error", message: "Failed to load users." }))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const updated = await patch<User>(`/api/admin/users/${userId}`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)));
      show({ variant: "success", message: "Role updated." });
    } catch {
      show({ variant: "error", message: "Failed to update role." });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Users</h2>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
        </div>
      ) : (
        <UserTable users={users} onRoleChange={handleRoleChange} />
      )}
    </div>
  );
}
