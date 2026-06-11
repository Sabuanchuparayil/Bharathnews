import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Eye, TrendingUp, DollarSign } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const mockData = {
  daily: [
    { day: 'Mon', views: 4200, articles: 180 },
    { day: 'Tue', views: 5100, articles: 210 },
    { day: 'Wed', views: 4800, articles: 195 },
    { day: 'Thu', views: 6200, articles: 220 },
    { day: 'Fri', views: 5900, articles: 205 },
    { day: 'Sat', views: 3800, articles: 150 },
    { day: 'Sun', views: 3200, articles: 130 },
  ],
  channels: [
    { name: 'Website', value: 45 },
    { name: 'Telegram', value: 25 },
    { name: 'WhatsApp', value: 15 },
    { name: 'Facebook', value: 10 },
    { name: 'YouTube', value: 5 },
  ],
};

const COLORS = ['#4338ca', '#10b981', '#0ea5e9', '#f59e0b', '#f43f5e'];

const StatCard = ({ icon: Icon, label, value, change, color }) => (
  <div className="glass-card-solid rounded-2xl p-5">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {change && <span className="text-xs font-medium text-accent-emerald">+{change}%</span>}
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-sm text-gray-500 mt-0.5">{label}</p>
  </div>
);

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-surface-1 dark:bg-dark-surface-0">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">Analytics Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Eye} label="Page Views (7d)" value="33,200" change={12} color="bg-brand-600" />
          <StatCard icon={Users} label="Active Users" value="8,450" change={8} color="bg-accent-emerald" />
          <StatCard icon={TrendingUp} label="Articles Published" value="1,290" change={15} color="bg-accent-sky" />
          <StatCard icon={DollarSign} label="Est. Revenue" value="$420" change={22} color="bg-accent-amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card-solid rounded-2xl p-5">
            <h3 className="font-display font-bold text-base text-gray-900 dark:text-white mb-4">Daily Views & Articles</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mockData.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="views" fill="#4338ca" radius={[4, 4, 0, 0]} />
                <Bar dataKey="articles" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card-solid rounded-2xl p-5">
            <h3 className="font-display font-bold text-base text-gray-900 dark:text-white mb-4">Traffic by Channel</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={mockData.channels} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {mockData.channels.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {mockData.channels.map((ch, i) => (
                <div key={ch.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-gray-600 dark:text-gray-400">{ch.name}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{ch.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
