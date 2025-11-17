import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  installments: number;
  installment_terms: string;
  due_date: string;
  due_date_2?: string;
  due_date_3?: string;
  paid_date: string;
  status: string;
  notes: string;
}

export default function Finance() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "yyyy-MM"));
  const [filterType, setFilterType] = useState("all");
  
  const [formData, setFormData] = useState({
    type: "despesa",
    category: "fornecedor",
    description: "",
    amount: 0,
    payment_method: "pix",
    installments: 1,
    installment_terms: "",
    due_date: "",
    due_date_2: "",
    due_date_3: "",
    paid_date: "",
    status: "pendente",
    notes: "",
    customer_id: "",
    supplier_id: "",
  });

  useEffect(() => {
    if (user) {
      loadTransactions();
      loadCustomers();
      loadSuppliers();
    }
  }, [user, filterMonth, filterType]);

  const loadCustomers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id);
    if (data) setCustomers(data);
  };

  const loadSuppliers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("user_id", user.id);
    if (data) setSuppliers(data);
  };

  const loadTransactions = async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id);

    // Apply filters
    if (filterMonth) {
      const startDate = `${filterMonth}-01`;
      const endDate = `${filterMonth}-31`;
      query = query.gte("due_date", startDate).lte("due_date", endDate);
    }

    if (filterType !== "all") {
      query = query.eq("type", filterType);
    }

    const { data, error } = await query.order("due_date", { ascending: false });

    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare data, removing empty optional fields
    const dataToSubmit = {
      type: formData.type,
      category: formData.category,
      description: formData.description,
      amount: formData.amount,
      payment_method: formData.payment_method,
      installments: formData.installments,
      installment_terms: formData.installment_terms || null,
      due_date: formData.due_date,
      due_date_2: formData.due_date_2 || null,
      due_date_3: formData.due_date_3 || null,
      status: formData.status,
      notes: formData.notes || null,
      customer_id: formData.customer_id || null,
      supplier_id: formData.supplier_id || null,
    };

    if (editingTransaction) {
      const { error } = await supabase
        .from("transactions")
        .update(dataToSubmit)
        .eq("id", editingTransaction.id);

      if (error) {
        console.error("Erro ao atualizar:", error);
        toast.error("Erro ao atualizar transação");
      } else {
        toast.success("Transação atualizada com sucesso!");
        loadTransactions();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("transactions")
        .insert([{ ...dataToSubmit, user_id: user?.id }]);

      if (error) {
        console.error("Erro ao criar:", error);
        toast.error("Erro ao criar transação: " + error.message);
      } else {
        toast.success("Transação criada com sucesso!");
        loadTransactions();
        resetForm();
      }
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      ...transaction,
      due_date_2: transaction.due_date_2 || "",
      due_date_3: transaction.due_date_3 || "",
      customer_id: (transaction as any).customer_id || "",
      supplier_id: (transaction as any).supplier_id || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir transação");
    } else {
      toast.success("Transação excluída com sucesso!");
      loadTransactions();
    }
  };

  const resetForm = () => {
    setFormData({
      type: "despesa",
      category: "fornecedor",
      description: "",
      amount: 0,
      payment_method: "pix",
      installments: 1,
      installment_terms: "",
      due_date: "",
      due_date_2: "",
      due_date_3: "",
      paid_date: "",
      status: "pendente",
      notes: "",
      customer_id: "",
      supplier_id: "",
    });
    setEditingTransaction(null);
    setDialogOpen(false);
  };

  const toggleStatus = async (transaction: Transaction) => {
    const newStatus = transaction.status === "pago" ? "pendente" : "pago";
    const { error } = await supabase
      .from("transactions")
      .update({ status: newStatus })
      .eq("id", transaction.id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(`Status alterado para ${newStatus}`);
      loadTransactions();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "bg-success text-success-foreground";
      case "pendente":
        return "bg-warning text-warning-foreground";
      case "vencido":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const totals = transactions.reduce(
    (acc, t) => {
      if (t.status === "pago") {
        if (t.type === "receita") acc.receitas += Number(t.amount);
        else acc.despesas += Number(t.amount);
      }
      return acc;
    },
    { receitas: 0, despesas: 0 }
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground">Controle suas receitas e despesas</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2">
                <Plus className="h-4 w-4" />
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
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">A Receber</SelectItem>
                        <SelectItem value="despesa">A Pagar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="imposto">Imposto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  {formData.category === "fornecedor" && (
                    <>
                      <Label htmlFor="supplier">Fornecedor *</Label>
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
                    </>
                  )}
                  
                  {formData.category === "cliente" && (
                    <>
                      <Label htmlFor="customer">Cliente *</Label>
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
                    </>
                  )}
                  
                  {formData.category === "imposto" && (
                    <>
                      <Label htmlFor="description">Tipo de Imposto *</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: Number(e.target.value) })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Forma de Pagamento *</Label>
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
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="faturado">Faturado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.payment_method === "credito" && (
                  <div className="space-y-2">
                    <Label htmlFor="installments">Parcelas</Label>
                    <Select
                      value={String(formData.installments)}
                      onValueChange={(value) =>
                        setFormData({ ...formData, installments: Number(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}x
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.payment_method === "faturado" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="installment_terms">Prazo de Faturamento</Label>
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
                          <SelectItem value="30">30 dias</SelectItem>
                          <SelectItem value="30,60">30, 60 dias</SelectItem>
                          <SelectItem value="30,60,90">30, 60, 90 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.installment_terms === "30,60" && (
                      <div className="space-y-2">
                        <Label htmlFor="due_date_2">Data de Vencimento 2 (60 dias)</Label>
                        <Input
                          id="due_date_2"
                          type="date"
                          value={formData.due_date_2}
                          onChange={(e) =>
                            setFormData({ ...formData, due_date_2: e.target.value })
                          }
                        />
                      </div>
                    )}
                    
                    {formData.installment_terms === "30,60,90" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="due_date_2">Data de Vencimento 2 (60 dias)</Label>
                          <Input
                            id="due_date_2"
                            type="date"
                            value={formData.due_date_2}
                            onChange={(e) =>
                              setFormData({ ...formData, due_date_2: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="due_date_3">Data de Vencimento 3 (90 dias)</Label>
                          <Input
                            id="due_date_3"
                            type="date"
                            value={formData.due_date_3}
                            onChange={(e) =>
                              setFormData({ ...formData, due_date_3: e.target.value })
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="due_date">Data de Vencimento *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
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

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <div className="flex gap-4 flex-1">
                <div className="space-y-2">
                  <Label htmlFor="filter-month">Mês/Ano</Label>
                  <Input
                    id="filter-month"
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-48"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-type">Tipo de Transação</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="receita">A Receber</SelectItem>
                      <SelectItem value="despesa">A Pagar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-success">Receitas Pagas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totals.receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Despesas Pagas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totals.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma transação encontrada.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Badge variant={transaction.type === "receita" ? "default" : "secondary"}>
                            {transaction.type === "receita" ? "A Receber" : "A Pagar"}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{transaction.category}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="font-medium">
                          R$ {Number(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(transaction.due_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${getStatusColor(transaction.status)} cursor-pointer`}
                            onClick={() => toggleStatus(transaction)}
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(transaction.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
