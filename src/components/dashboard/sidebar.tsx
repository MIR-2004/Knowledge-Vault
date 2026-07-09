"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { authClient } from "@/lib/auth-client";
import {
  Brain,
  Folder,
  FolderPlus,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  HelpCircle,
  BookOpen,
  Edit2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: session } = authClient.useSession();
  const user = session?.user;

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // tRPC Queries
  const { data: folders = [], isLoading: foldersLoading } = trpc.folders.list.useQuery();
  const { data: notes = [], isLoading: notesLoading } = trpc.notes.list.useQuery();

  // Dialog states
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Folder toggles
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Deletion confirm modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: "folder" | "note";
    name: string;
  } | null>(null);

  // Mutations
  const createFolder = trpc.folders.create.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      setIsFolderOpen(false);
      setNewFolderName("");
    },
  });

  const deleteFolder = trpc.folders.delete.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      utils.notes.list.invalidate();
    },
  });

  const createNote = trpc.notes.create.useMutation({
    onSuccess: (data) => {
      utils.notes.list.invalidate();
      router.push(`/dashboard/notes?id=${data.id}`);
    },
  });

  const deleteNote = trpc.notes.delete.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate();
      router.push("/dashboard");
    },
  });

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    createFolder.mutate({ name: newFolderName, parentId: null });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Filter notes & folders based on search
  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-64 border-r border-border/40 bg-card/30 flex flex-col h-screen select-none text-foreground">
      {/* Top logo */}
      <div className="p-4 border-b border-border/20 flex items-center gap-2">
        <div className="bg-primary/20 p-1.5 rounded border border-primary/30">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <span className="font-bold text-sm tracking-wider text-primary">KNOWLEDGE VAULT</span>
      </div>

      {/* Nav Actions */}
      <nav className="p-4 space-y-1">
        <Link href="/dashboard">
          <span
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold cursor-pointer transition-colors ${
              pathname === "/dashboard"
                ? "bg-secondary text-primary border border-border/30"
                : "hover:bg-card/50 text-foreground/80 hover:text-foreground"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </span>
        </Link>
        <Link href="/dashboard/pdfs">
          <span
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold cursor-pointer transition-colors ${
              pathname.startsWith("/dashboard/pdfs")
                ? "bg-secondary text-primary border border-border/30"
                : "hover:bg-card/50 text-foreground/80 hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            PDF Vault
          </span>
        </Link>
        <Link href="/dashboard/flashcards">
          <span
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold cursor-pointer transition-colors ${
              pathname.startsWith("/dashboard/flashcards")
                ? "bg-secondary text-primary border border-border/30"
                : "hover:bg-card/50 text-foreground/80 hover:text-foreground"
            }`}
          >
            <Brain className="h-4 w-4" />
            Study Flashcards
          </span>
        </Link>
        <Link href="/dashboard/interview">
          <span
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold cursor-pointer transition-colors ${
              pathname.startsWith("/dashboard/interview")
                ? "bg-secondary text-primary border border-border/30"
                : "hover:bg-card/50 text-foreground/80 hover:text-foreground"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            Interview Prep
          </span>
        </Link>
      </nav>

      {/* Search box */}
      <div className="px-4 mb-2">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-foreground/40" />
          <Input
            placeholder="Search notes..."
            className="pl-8 h-8 text-xs bg-background/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Folder structure */}
      <div className="flex-1 overflow-y-auto px-4 py-2 border-t border-border/10">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-primary mb-3">
          <span>Files & Folders</span>
          <button
            onClick={() => setIsFolderOpen(true)}
            className="hover:text-foreground transition-colors p-0.5"
            title="Create Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>

        {foldersLoading || notesLoading ? (
          <div className="text-[10px] text-foreground/40 text-center py-4">Loading explorer...</div>
        ) : (
          <div className="space-y-3">
            {/* Render Folders */}
            {filteredFolders.map((f) => {
              const isExpanded = expandedFolders[f.id];
              const folderNotes = filteredNotes.filter((n) => n.folderId === f.id);
              
              return (
                <div key={f.id} className="space-y-1">
                  <div className="group flex items-center justify-between text-xs hover:bg-card/40 px-2 py-1 rounded transition-colors text-foreground/90">
                    <button
                      onClick={() => toggleFolder(f.id)}
                      className="flex items-center gap-2 flex-1 text-left font-medium truncate"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-primary" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                      <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{f.name}</span>
                    </button>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity shrink-0">
                      <button
                        onClick={() => createNote.mutate({ title: "Untitled Note", content: "", folderId: f.id })}
                        className="text-primary hover:text-foreground p-0.5"
                        title="Add Note"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: f.id, type: "folder", name: f.name })}
                        className="text-destructive hover:text-destructive/80 p-0.5 cursor-pointer"
                        title="Delete Folder"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Render Folder Notes */}
                  {isExpanded && (
                    <div className="pl-4 border-l border-border/20 ml-3.5 space-y-1">
                      {folderNotes.length === 0 ? (
                        <div className="text-[10px] text-foreground/30 py-1 pl-2">Empty Folder</div>
                      ) : (
                        folderNotes.map((n) => (
                          <div
                            key={n.id}
                            className={`group flex items-center justify-between text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                              pathname.includes(`/dashboard/notes`) &&
                              new URLSearchParams(window.location.search).get("id") === n.id
                                ? "bg-secondary text-primary"
                                : "hover:bg-card/30 text-foreground/75"
                            }`}
                          >
                            <Link href={`/dashboard/notes?id=${n.id}`} className="flex items-center gap-2 flex-1 truncate">
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="truncate">{n.title}</span>
                            </Link>
                            <button
                              onClick={() => setDeleteConfirm({ id: n.id, type: "note", name: n.title })}
                              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 p-0.5 transition-opacity shrink-0"
                              title="Delete Note"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Root level notes (outside any folder) */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-primary/70 mb-1">
                <span>Notes</span>
                <button
                  onClick={() => createNote.mutate({ title: "Untitled Note", content: "", folderId: null })}
                  className="hover:text-foreground transition-colors p-0.5"
                  title="Create Root Note"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {filteredNotes
                .filter((n) => !n.folderId)
                .map((n) => (
                  <div
                    key={n.id}
                    className={`group flex items-center justify-between text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                      pathname.includes(`/dashboard/notes`) &&
                      new URLSearchParams(window.location.search).get("id") === n.id
                        ? "bg-secondary text-primary"
                        : "hover:bg-card/30 text-foreground/75"
                    }`}
                  >
                    <Link href={`/dashboard/notes?id=${n.id}`} className="flex items-center gap-2 flex-1 truncate">
                      <FileText className="h-3 w-3 shrink-0" />
                      <span className="truncate">{n.title}</span>
                    </Link>
                    <button
                      onClick={() => setDeleteConfirm({ id: n.id, type: "note", name: n.title })}
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 p-0.5 transition-opacity shrink-0"
                      title="Delete Note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-border/20 bg-background/50 flex items-center justify-between text-xs">
        <div className="truncate pr-2">
          <p className="font-semibold text-foreground truncate">{user?.name || "User"}</p>
          <p className="text-[10px] text-foreground/60 truncate">{user?.email || ""}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-foreground/60 hover:text-destructive p-1 rounded hover:bg-card transition-all cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* New Folder Modal */}
      <Dialog open={isFolderOpen} onOpenChange={setIsFolderOpen}>
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateFolder}>
          <DialogContent>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-primary">Folder Name</label>
              <Input
                placeholder="Study Guides, Projects..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!newFolderName.trim()}>
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription className="mt-2 text-xs leading-relaxed text-foreground/80">
            Are you sure you want to permanently delete the {deleteConfirm?.type} &quot;{deleteConfirm?.name}&quot;? 
            {deleteConfirm?.type === "folder" && " All notes inside this folder will be deleted as well."} This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteConfirm(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (!deleteConfirm) return;
              if (deleteConfirm.type === "folder") {
                deleteFolder.mutate({ id: deleteConfirm.id }, {
                  onSuccess: () => setDeleteConfirm(null),
                });
              } else {
                deleteNote.mutate({ id: deleteConfirm.id }, {
                  onSuccess: () => setDeleteConfirm(null),
                });
              }
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </aside>
  );
}
