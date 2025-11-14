import { useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { Plus, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  expected_date: string;
  actual_date: string;
  cost: number;
}

interface ProjectTasksProps {
  project: any;
  onBack: () => void;
}

export default function ProjectTasks({ project, onBack }: ProjectTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    expected_date: "",
    actual_date: "",
    cost: 0,
  });

  useEffect(() => {
    loadTasks();
  }, [project]);

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", project.id)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setTasks(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let uploadedPhotoUrls: string[] = [...photoUrls];

      // Upload new photos
      if (photos.length > 0) {
        for (const photo of photos) {
          const fileExt = photo.name.split(".").pop();
          const fileName = `${project.id}-${Date.now()}-${Math.random()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from("project-photos")
            .upload(`tasks/${fileName}`, photo);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("project-photos")
            .getPublicUrl(`tasks/${fileName}`);

          uploadedPhotoUrls.push(publicUrl);
        }
      }

      if (editingTask) {
        const { error } = await supabase
          .from("tasks")
          .update({
            ...formData,
            photo_urls: uploadedPhotoUrls,
          })
          .eq("id", editingTask.id);

        if (error) throw error;
        toast.success("Tarefa atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("tasks")
          .insert([{ 
            ...formData, 
            photo_urls: uploadedPhotoUrls,
            project_id: project.id 
          }]);

        if (error) throw error;
        toast.success("Tarefa criada com sucesso!");
      }

      loadTasks();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar tarefa");
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData(task);
    setPhotoUrls((task as any).photo_urls || []);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir tarefa");
    } else {
      toast.success("Tarefa excluída com sucesso!");
      loadTasks();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "todo",
      expected_date: "",
      actual_date: "",
      cost: 0,
    });
    setPhotos([]);
    setPhotoUrls([]);
    setEditingTask(null);
    setDialogOpen(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + photoUrls.length + files.length > 5) {
      toast.error("Máximo de 5 fotos permitido");
      return;
    }
    setPhotos([...photos, ...files]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-muted text-muted-foreground";
      case "doing":
        return "bg-warning text-warning-foreground";
      case "done":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "A Fazer";
      case "doing":
        return "Em Andamento";
      case "done":
        return "Concluído";
      default:
        return status;
    }
  };

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    doing: tasks.filter((t) => t.status === "doing"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <p className="text-muted-foreground">Fluxo de Obra</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="doing">Em Andamento</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expected_date">Data Prevista</Label>
                  <Input
                    id="expected_date"
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expected_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual_date">Data Real</Label>
                  <Input
                    id="actual_date"
                    type="date"
                    value={formData.actual_date}
                    onChange={(e) =>
                      setFormData({ ...formData, actual_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Custo (R$)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photos">Fotos da Tarefa (máximo 5)</Label>
                <Input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                />
                {(photos.length > 0 || photoUrls.length > 0) && (
                  <p className="text-sm text-muted-foreground">
                    {photos.length + photoUrls.length} foto(s) selecionada(s)
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTask ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-6 md:grid-cols-3">
        {["todo", "doing", "done"].map((status) => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{getStatusLabel(status)}</span>
                <Badge variant="outline">{tasksByStatus[status as keyof typeof tasksByStatus].length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasksByStatus[status as keyof typeof tasksByStatus].map((task) => (
                <Card key={task.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge className={getStatusColor(task.status)} variant="secondary">
                        {getStatusLabel(task.status)}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    {task.cost > 0 && (
                      <p className="text-sm font-medium">
                        R$ {task.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(task)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {tasksByStatus[status as keyof typeof tasksByStatus].length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma tarefa
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
