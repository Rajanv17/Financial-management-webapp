import { useState } from "react";
import { CategoryCard } from "@/components/category-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Tags } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  userId?: string;
  isDefault: boolean;
  icon?: string;
  color?: string;
  isArchived?: boolean;
  archivedAt?: Date;
  createdAt: Date;
}

const defaultCategories: Category[] = [
  {
    id: "1",
    name: "Food & Dining",
    type: "expense",
    color: "#F97316",
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "Transportation",
    type: "expense",
    color: "#3B82F6",
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "3",
    name: "Shopping",
    type: "expense",
    color: "#EC4899",
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "4",
    name: "Entertainment",
    type: "expense",
    color: "#A855F7",
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "5",
    name: "Bills & Utilities",
    type: "expense",
    color: "#EF4444",
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "6",
    name: "Healthcare",
    type: "expense",
    color: "#14B8A6",
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "7",
    name: "Salary",
    type: "income",
    color: "#22C55E",
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "8",
    name: "Freelance",
    type: "income",
    color: "#06B6D4",
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "9",
    name: "Investments",
    type: "income",
    color: "#6366F1",
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: "10",
    name: "Gifts",
    type: "income",
    color: "#F59E0B",
    isDefault: false,
    createdAt: new Date(),
  },
];

interface CategorySectionProps {
  title: string;
  items: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

function CategorySection({
  title,
  items,
  onEdit,
  onDelete,
}: CategorySectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default function Categories() {
  // const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "income" | "expense" | "both"
  >("all");

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || category.type === filterType;
    return matchesSearch && matchesType;
  });

  const expenseCategories = filteredCategories.filter(
    (c) => c.type === "expense",
  );
  const incomeCategories = filteredCategories.filter(
    (c) => c.type === "income",
  );
  // const bothCategories = filteredCategories.filter((c) => c.type === "both");

  // const handleSubmit = (data: Omit<Category, "id" | "createdAt">) => {
  //   if (editingCategory) {
  //     setCategories((prev) =>
  //       prev.map((c) => (c.id === editingCategory.id ? { ...c, ...data } : c))
  //     );
  //     // toast({ title: "Category updated successfully" });
  //   } else {
  //     const newCategory: Category = {
  //       ...data,
  //       id: Date.now().toString(),
  //       createdAt: new Date(),
  //     };
  //     setCategories((prev) => [...prev, newCategory]);
  //     // toast({ title: "Category created successfully" });
  //   }
  //   setIsFormOpen(false);
  //   setEditingCategory(null);
  // };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      setCategories((prev) => prev.filter((c) => c.id !== deleteId));
      // toast({ title: "Category deleted successfully" });
      setDeleteId(null);
    }
  };

  // const CategorySection = ({
  //   title,
  //   items,
  // }: {
  //   title: string;
  //   items: Category[];
  // }) => {
  //   if (items.length === 0) return null;
  //   return (
  //     <div className="space-y-3">
  //       <h2 className="text-lg font-semibold text-foreground">{title}</h2>
  //       <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  //         {items.map((category) => (
  //           <CategoryCard
  //             key={category.id}
  //             category={category}
  //             onEdit={handleEdit}
  //             onDelete={setDeleteId}
  //           />
  //         ))}
  //       </div>
  //     </div>
  //   );
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Categories
          </h1>
          <p className="text-muted-foreground pt-2">
            Manage your transaction categories
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filterType}
          onValueChange={(v) => setFilterType(v as typeof filterType)}
        >
          <SelectTrigger className="w-full sm:w-40 h-9">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Sections */}
      {filteredCategories.length > 0 ? (
        <div className="space-y-8">
          <CategorySection
            title="Expense Categories"
            items={expenseCategories}
            onEdit={handleEdit}
            onDelete={setDeleteId}
          />

          <CategorySection
            title="Income Categories"
            items={incomeCategories}
            onEdit={handleEdit}
            onDelete={setDeleteId}
          />

          {/* <CategorySection title="General Categories" items={bothCategories} /> */}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Tags className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No categories found
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || filterType !== "all"
              ? "Try adjusting your filters"
              : "Create your first category to get started"}
          </p>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCategory(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
          </DialogHeader>
          {/* <CategoryForm
            category={editingCategory}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingCategory(null);
            }}
          /> */}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
