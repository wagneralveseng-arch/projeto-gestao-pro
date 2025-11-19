import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Transaction {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
  installments: number;
  installment_terms: string | null;
  notes: string | null;
  customer_id: string | null;
  supplier_id: string | null;
  employee_id: string | null;
  project_id: string | null;
}

interface Customer {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
}

export default function Finance() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");

  const [formData, setFormData] = useState({
    type: "despesa",
    category: "Fornecedor",
    description: "",
    amount: "",
    due_date: "",
    payment_method: "Pix",
    installments: 1,
    installment_terms: "",
    status: "pendente",
    notes: "",
    customer_id: "",
    supplier_id: "",
    employee_id: "",
    project_id: "",
  });

  useEffect(() => {
    if (user) {
      loadTransactions();
      loadCustomers();
      loadSuppliers();
      loadEmployees();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .order("due_date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar transações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("user_id", user?.id);

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
        .eq("user_id", user?.id);

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, name")
        .eq("user_id", user?.id);

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      type: formData.type,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      payment_method: formData.payment_method,
      installments: formData.installments,
      installment_terms: formData.installment_terms || null,
      due_date: formData.due_date,
      status: formData.status,
      notes: formData.notes || null,
    };

    // Add related IDs based on category
    if (formData.category === "Receita" && formData.customer_id) {
      payload.customer_id = formData.customer_id;
    }
    if (formData.category === "Fornecedor" && formData.supplier_id) {
      payload.supplier_id = formData.supplier_id;
    }
    if (formData.category === "Funcionário" && formData.employee_id) {
      payload.employee_id = formData.employee_id;
    }

    try {
      if (editingTransaction) {
        const { error } = await supabase
          .from("transactions")
          .update(payload)
          .eq("id", editingTransaction.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Transação atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from("transactions")
          .insert([{ ...payload, user_id: user?.id }]);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Transação criada com sucesso!",
        });
      }

      loadTransactions();
      resetForm();
      setOpen(false);
    } catch (error: any) {
      console.error("Erro ao salvar transação:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a transação",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount.toString(),
      due_date: transaction.due_date,
      payment_method: transaction.payment_method || "Pix",
      installments: transaction.installments,
      installment_terms: transaction.installment_terms || "",
      status: transaction.status,
      notes: transaction.notes || "",
      customer_id: transaction.customer_id || "",
      supplier_id: transaction.supplier_id || "",
      employee_id: transaction.employee_id || "",
      project_id: transaction.project_id || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso!",
      });
      loadTransactions();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a transação",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: "despesa",
      category: "Fornecedor",
      description: "",
      amount: "",
      due_date: "",
      payment_method: "Pix",
      installments: 1,
      installment_terms: "",
      status: "pendente",
      notes: "",
      customer_id: "",
      supplier_id: "",
      employee_id: "",
      project_id: "",
    });
    setEditingTransaction(null);
  };

  const toggleStatus = async (transaction: Transaction) => {
    const newStatus = transaction.status === "pendente" ? "pago" : "pendente";
    const paid_date = newStatus === "pago" ? new Date().toISOString().split("T")[0] : null;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({ status: newStatus, paid_date })
        .eq("id", transaction.id);

      if (error) throw error;
      loadTransactions();
      toast({
        title: "Sucesso",
        description: `Status alterado para ${newStatus}`,
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    return status === "pago"
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesMonth = filterMonth
      ? transaction.due_date.startsWith(filterMonth)
      : true;
    const matchesType =
      filterType === "all" ? true : transaction.type === filterType;
    return matchesMonth && matchesType;
  });

  const totals = filteredTransactions.reduce(
    (acc, transaction) => {
      if (transaction.status === "pago") {
        if (transaction.type === "receita") {
          acc.revenue += transaction.amount;
        } else {
          acc.expenses += transaction.amount;
        }
      }
      return acc;
    },
    { revenue: 0, expenses: 0 }
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? "Editar Transação" : "Nova Transação"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Receita">Receita</SelectItem>
                        <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                        <SelectItem value="Imposto">Imposto</SelectItem>
                        <SelectItem value="Funcionário">Funcionário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.category === "Receita" && (
                  <div>
                    <Label htmlFor="customer_id">Cliente</Label>
                    <Select
                      value={formData.customer_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, customer_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.category === "Fornecedor" && (
                  <div>
                    <Label htmlFor="supplier_id">Fornecedor</Label>
                    <Select
                      value={formData.supplier_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, supplier_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.category === "Funcionário" && (
                  <div>
                    <Label htmlFor="employee_id">Funcionário</Label>
                    <Select
                      value={formData.employee_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, employee_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="due_date">Data de Vencimento</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, due_date: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_method">Forma de Pagamento</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) =>
                        setFormData({ ...formData, payment_method: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pix">Pix</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="Cartão de Crédito">
                          Cartão de Crédito
                        </SelectItem>
                        <SelectItem value="Faturado">Faturado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.payment_method === "Cartão de Crédito" && (
                    <div>
                      <Label htmlFor="installments">Parcelas</Label>
                      <Select
                        value={formData.installments.toString()}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            installments: parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}x
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.payment_method === "Faturado" && (
                    <div>
                      <Label htmlFor="installment_terms">Prazo</Label>
                      <Select
                        value={formData.installment_terms}
                        onValueChange={(value) =>
                          setFormData({ ...formData, installment_terms: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30 dias">30 dias</SelectItem>
                          <SelectItem value="30, 60 dias">
                            30, 60 dias
                          </SelectItem>
                          <SelectItem value="30, 60, 90 dias">
                            30, 60, 90 dias
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTransaction ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filter-month">Mês</Label>
                <Input
                  id="filter-month"
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filter-type">Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Recebido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                R$ {totals.revenue.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total de Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                R$ {totals.expenses.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Transações */}
        <Card>
          <CardHeader>
            <CardTitle>Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.due_date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="capitalize">
                        {transaction.type}
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>R$ {transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleStatus(transaction)}
                          className={`px-2 py-1 rounded text-sm ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status === "pago" ? "Pago" : "Pendente"}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
