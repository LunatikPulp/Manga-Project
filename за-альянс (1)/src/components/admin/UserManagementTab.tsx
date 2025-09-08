import React, { useContext } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { AuthContext } from '../../contexts/AuthContext';
import Avatar from '../Avatar';
import { User } from '../../types';

const SUPER_ADMIN_EMAIL = 'admin@example.com';

const UserManagementTab: React.FC = () => {
    const { user: currentUser } = useContext(AuthContext);
    const { users, updateUserStatus, updateUserRole } = useUsers();

    const handleRoleChange = (email: string, role: User['role']) => {
        updateUserRole(email, role);
    };

    return (
        <div className="bg-surface rounded-lg overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-overlay">
                    <tr>
                        <th className="p-4 text-sm font-semibold text-muted tracking-wider">Пользователь</th>
                        <th className="p-4 text-sm font-semibold text-muted tracking-wider">Email</th>
                        <th className="p-4 text-sm font-semibold text-muted tracking-wider">Роль</th>
                        <th className="p-4 text-sm font-semibold text-muted tracking-wider">Статус</th>
                        <th className="p-4 text-sm font-semibold text-muted tracking-wider">Действия</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-overlay">
                    {users.map(user => {
                        const canChangeRole = currentUser?.email !== user.email && user.email !== SUPER_ADMIN_EMAIL;
                        const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL;

                        return (
                            <tr key={user.email} className="hover:bg-overlay transition-colors">
                                <td className="p-4 font-medium text-text-primary flex items-center gap-3">
                                    <Avatar name={user.avatar} size={32} />
                                    <span>{user.username}</span>
                                </td>
                                <td className="p-4 text-text-secondary">{user.email}</td>
                                <td className="p-4 text-text-secondary capitalize">{user.role}</td>
                                <td className="p-4 text-text-secondary">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        {canChangeRole && (
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.email, e.target.value as User['role'])}
                                                className="bg-base border border-overlay rounded-md p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
                                            >
                                                <option value="user">Пользователь</option>
                                                <option value="moderator">Модератор</option>
                                                {isSuperAdmin && <option value="admin">Администратор</option>}
                                            </select>
                                        )}
                                        {user.role !== 'admin' && (
                                            user.status === 'active' ? (
                                                <button 
                                                    onClick={() => updateUserStatus(user.email, 'banned')}
                                                    className="text-xs bg-base hover:bg-red-900/50 text-brand-accent font-semibold py-1.5 px-3 rounded-md transition-colors"
                                                >
                                                    Заблокировать
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => updateUserStatus(user.email, 'active')}
                                                    className="text-xs bg-base hover:bg-green-900/50 text-green-300 font-semibold py-1.5 px-3 rounded-md transition-colors"
                                                >
                                                    Разблокировать
                                                </button>
                                            )
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagementTab;