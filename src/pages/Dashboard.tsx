import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Hammer, CheckCircle2, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), "yyyy"));
  
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    monthlyProfit: 0,
  });

  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [projectDistribution, setProjectDistribution] = useState<any[]>([]);
  const [expenseDistribution, setExpenseDistribution] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, selectedMonth, selectedYear]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load projects stats
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id);

      const activeProjects = projects?.filter(p => p.status !== "concluida").length || 0;
      const completedProjects = projects?.filter(p => p.status === "concluida").length || 0;

      // Load financial data for the selected period
      const startDate = startOfMonth(new Date(`${selectedYear}-${selectedMonth.split('-')[1]}-01`));
      const endDate = endOfMonth(startDate);

      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("due_date", format(startDate, "yyyy-MM-dd"))
        .lte("due_date", format(endDate, "yyyy-MM-dd"));

      // Calculate monthly profit
      const receitas = transactions?.filter(t => t.type === "receita" && t.status === "pago")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const despesas = transactions?.filter(t => t.type === "despesa" && t.status === "pago")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const monthlyProfit = receitas - despesas;

      // Prepare cash flow data by month
      const { data: yearTransactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("due_date", `${selectedYear}-01-01`)
        .lte("due_date", `${selectedYear}-12-31`);

      const monthlyData: { [key: string]: { receitas: number; fornecedor: number; imposto: number } } = {};

      for (let i = 1; i <= 12; i++) {
        const monthKey = format(new Date(Number(selectedYear), i - 1, 1), "MMM", { locale: ptBR });
        monthlyData[monthKey] = { receitas: 0, fornecedor: 0, imposto: 0 };
      }

      yearTransactions?.forEach(t => {
        if (t.status !== "pago") return;
        const month = format(new Date(t.due_date), "MMM", { locale: ptBR });
        if (t.type === "receita") {
          monthlyData[month].receitas += Number(t.amount);
        } else if (t.category === "fornecedor") {
          monthlyData[month].fornecedor += Number(t.amount);
        } else if (t.category === "imposto") {
          monthlyData[month].imposto += Number(t.amount);
        }
      });

      const chartData = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        Receitas: data.receitas,
        Fornecedor: data.fornecedor,
        Imposto: data.imposto,
        Lucro: data.receitas - data.fornecedor - data.imposto,
      }));

      // Project distribution by status
      const projectsByStatus = [
        { name: "Planejamento", value: projects?.filter(p => p.status === "planejamento").length || 0, color: "#f59e0b" },
        { name: "Em Andamento", value: projects?.filter(p => p.status === "em_andamento").length || 0, color: "#3b82f6" },
        { name: "Concluída", value: projects?.filter(p => p.status === "concluida").length || 0, color: "#10b981" },
      ].filter(item => item.value > 0);

      // Expense distribution by supplier
      const supplierExpenses: { [key: string]: number } = {};
      yearTransactions?.forEach(t => {
        if (t.type === "despesa" && t.category === "fornecedor" && t.status === "pago") {
          supplierExpenses[t.description] = (supplierExpenses[t.description] || 0) + Number(t.amount);
        }
      });

      const expensesBySupplier = Object.entries(supplierExpenses)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); // Top 8 suppliers

      setCashFlowData(chartData);
      setProjectDistribution(projectsByStatus);
      setExpenseDistribution(expensesBySupplier);
      setStats({ activeProjects, completedProjects, monthlyProfit });
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => Number(selectedYear) - 2 + i).map(String);
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2024, i, 1);
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM", { locale: ptBR }),
    };
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Obras Ativas</CardTitle>
              <Hammer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Obras Concluídas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedProjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro do Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.monthlyProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Receitas - (Fornecedor + Impostos) pagas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) =>
                    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  }
                />
                <Legend />
                <Bar dataKey="Receitas" stackId="a" fill="hsl(var(--secondary))" />
                <Bar dataKey="Fornecedor" stackId="a" fill="hsl(var(--destructive))" />
                <Bar dataKey="Imposto" stackId="a" fill="hsl(var(--success))" />
                <Line type="monotone" dataKey="Lucro" stroke="hsl(var(--primary))" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Project Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Obras por Status</CardTitle>
            </CardHeader>
            <CardContent>
              {projectDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {projectDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  Nenhuma obra cadastrada
                </p>
              )}
            </CardContent>
          </Card>

          {/* Expense Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Fornecedor</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={(entry) => entry.name}
                    >
                      {expenseDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`hsl(${(index * 360) / expenseDistribution.length}, 70%, 50%)`}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  Nenhuma despesa paga
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
