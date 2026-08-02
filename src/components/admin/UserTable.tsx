"use client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  users: User[];
  onRoleChange: (userId: string, newRole: string) => Promise<void>;
}

export function UserTable({ users, onRoleChange }: Props) {
  if (!users.length) {
    return <p className="text-sm text-gray-500">No users found.</p>;
  }
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-gray-200 text-left">
          <th className="pb-2 font-medium text-gray-700">Name</th>
          <th className="pb-2 font-medium text-gray-700">Email</th>
          <th className="pb-2 font-medium text-gray-700">Role</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-b border-gray-100">
            <td className="py-2 text-gray-900">{user.name}</td>
            <td className="py-2 text-gray-500">{user.email}</td>
            <td className="py-2">
              <select
                aria-label={`Role for ${user.name}`}
                value={user.role}
                onChange={(e) => {
                  const newRole = e.target.value;
                  if (confirm(`Change ${user.name}'s role to ${newRole}?`)) {
                    onRoleChange(user.id, newRole);
                  }
                }}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
