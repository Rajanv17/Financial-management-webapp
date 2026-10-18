import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  StatusBadge,
  TableSkeleton,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  archiveCategory,
  createCategory,
  fetchCategories,
  restoreCategory,
  updateCategory,
} from "@/features/categories/api";
import { CategoryFormDialog } from "@/features/categories/category-form-dialog";
import { categoryIcon } from "@/features/categories/icons";
import type { Category, CategoryFormInput } from "@/features/categories/types";
import { ApiClientError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

type CategoryTab = "all" | "expense" | "income" | "archived";

const queryErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiClientError ? error.message : fallback;

export default function Categories() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<CategoryTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [archiving, setArchiving] = useState<Category | null>(null);

  const archived = tab === "archived";

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(archived),
    queryFn: () => fetchCategories(archived),
  });

  const invalidateRelated = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
    ]);

  const saveMutation = useMutation({
    mutationFn: async (payload: CategoryFormInput) => {
      if (editing) {
        return updateCategory(editing.id, {
          name: payload.name,
          icon: payload.icon,
          color: payload.color,
        });
      }
      return createCategory(payload);
    },
    onSuccess: async () => {
      await invalidateRelated();
      toast.success(editing ? "Category updated" : "Category created");
      setFormOpen(false);
      setEditing(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveCategory(id),
    onSuccess: async () => {
      await invalidateRelated();
      toast.success("Category archived");
      setArchiving(null);
    },
    onError: (error) => {
      toast.error(queryErrorMessage(error, "Could not archive the category."));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreCategory(id),
    onSuccess: async () => {
      await invalidateRelated();
      toast.success("Category restored");
    },
    onError: (error) => {
      toast.error(queryErrorMessage(error, "Could not restore the category."));
    },
  });

  const categories = useMemo(() => {
    const items = [...(categoriesQuery.data ?? [])];
    items.sort((a, b) => a.name.localeCompare(b.name, "en-IN"));
    return items;
  }, [categoriesQuery.data]);

  const search = searchQuery.trim().toLowerCase();
  const typeFiltered =
    tab === "expense" || tab === "income"
      ? categories.filter((category) => category.type === tab)
      : categories;
  const visible = search
    ? typeFiltered.filter((category) =>
        category.name.toLowerCase().includes(search),
      )
    : typeFiltered;

  const isEmpty = categories.length === 0 && search === "";
  const isNoResults = categories.length > 0 && visible.length === 0;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const renderAddButton = () => (
    <Button type="button" onClick={openCreate}>
      <Plus />
      Add Category
    </Button>
  );

  const clearFilters = () => {
    setSearchQuery("");
    setTab("all");
  };

  const renderActions = (category: Category) => {
    if (category.isDefault) return null;

    if (archived) {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={restoreMutation.isPending}
          aria-label={`Restore ${category.name}`}
          onClick={() => restoreMutation.mutate(category.id)}
        >
          <RotateCcw />
          Restore
        </Button>
      );
    }

    return (
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Edit ${category.name}`}
          onClick={() => {
            setEditing(category);
            setFormOpen(true);
          }}
        >
          <Pencil />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Archive ${category.name}`}
          onClick={() => setArchiving(category)}
        >
          <Archive />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage your transaction categories."
        action={renderAddButton()}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search categories"
            className="pl-9"
            aria-label="Search categories"
          />
        </div>
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as CategoryTab)}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        {search !== "" || tab !== "all" ? (
          <Button type="button" variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {categoriesQuery.isLoading ? <TableSkeleton columns={5} /> : null}

      {categoriesQuery.isError ? (
        <ErrorState
          message={queryErrorMessage(
            categoriesQuery.error,
            "Could not load categories.",
          )}
          onRetry={() => void categoriesQuery.refetch()}
        />
      ) : null}

      {categoriesQuery.isSuccess && isEmpty ? (
        <EmptyState
          title={archived ? "No archived categories" : "No categories yet"}
          description={
            archived
              ? "Archived custom categories will appear here."
              : "Create a category to organise your transactions."
          }
          action={archived ? undefined : renderAddButton()}
        />
      ) : null}

      {categoriesQuery.isSuccess && isNoResults ? (
        <EmptyState
          title="No matching categories"
          description="Try a different search or tab."
          action={
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : null}

      {categoriesQuery.isSuccess && visible.length > 0 ? (
        <>
          <div className="space-y-3 md:hidden">
            {visible.map((category) => {
              const Icon = categoryIcon(category.icon);
              return (
                <article
                  key={category.id}
                  className="space-y-3 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full bg-muted-foreground"
                            style={
                              category.color
                                ? { backgroundColor: category.color }
                                : undefined
                            }
                          />
                          <p className="font-medium text-foreground">{category.name}</p>
                          {category.isDefault ? (
                            <Badge variant="secondary">Default</Badge>
                          ) : null}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusBadge
                            label={category.type === "income" ? "Income" : "Expense"}
                            tone={category.type}
                          />
                          <StatusBadge
                            label={category.isArchived ? "Archived" : "Active"}
                            tone={category.isArchived ? "warning" : "neutral"}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">{renderActions(category)}</div>
                </article>
              );
            })}
          </div>

          <div className="hidden rounded-xl border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((category) => {
                  const Icon = categoryIcon(category.icon);
                  return (
                    <TableRow key={category.id}>
                      <TableCell>
                        <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                          <Icon className="size-4" />
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full bg-muted-foreground"
                            style={
                              category.color
                                ? { backgroundColor: category.color }
                                : undefined
                            }
                          />
                          <span className="font-medium text-foreground">
                            {category.name}
                          </span>
                          {category.isDefault ? (
                            <Badge variant="secondary">Default</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={category.type === "income" ? "Income" : "Expense"}
                          tone={category.type}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={category.isArchived ? "Archived" : "Active"}
                          tone={category.isArchived ? "warning" : "neutral"}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          {renderActions(category) ?? (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}

      <CategoryFormDialog
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        open={formOpen}
        category={editing}
        pending={saveMutation.isPending}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={async (payload) => {
          await saveMutation.mutateAsync(payload);
        }}
      />

      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(open) => {
          if (!open) setArchiving(null);
        }}
        title="Archive category"
        description="This category will be hidden from new transactions and budgets. Existing history is kept, and you can restore it later."
        confirmLabel="Archive"
        pendingLabel="Archiving…"
        pending={archiveMutation.isPending}
        onConfirm={async () => {
          if (archiving) {
            await archiveMutation.mutateAsync(archiving.id);
          }
        }}
      />
    </div>
  );
}
