// "use client" directive
"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { modifierGroupSchema, modifierSchema, type ModifierGroupInput, type ModifierInput } from "@/lib/schemas/menu";
import { createModifierGroup, updateModifierGroup, deleteModifierGroup, createModifier, updateModifier, deleteModifier } from "@/actions/product-options";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Settings, Pencil, Trash2, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Modifier {
    id: string;
    name: string;
    price: number;
    available: boolean;
}

interface ModifierGroup {
    id: string;
    name: string;
    required: boolean;
    multiSelect: boolean;
    minSelect: number;
    maxSelect: number | null;
    modifiers: Modifier[];
}

interface ModifierManagerProps {
    productId: string;
    modifierGroups: ModifierGroup[];
    onRefresh: () => void;
}

export function ModifierManager({ productId, modifierGroups, onRefresh }: ModifierManagerProps) {
    // Local state mirrors props but allows optimistic UI updates
    const [localGroups, setLocalGroups] = useState<ModifierGroup[]>(modifierGroups);
    useEffect(() => { setLocalGroups(modifierGroups); }, [modifierGroups]);

    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [isModifierDialogOpen, setIsModifierDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
    const [editingModifier, setEditingModifier] = useState<Modifier | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Forms
    const groupForm = useForm({
        resolver: zodResolver(modifierGroupSchema),
        defaultValues: { name: "", required: false, multiSelect: true, minSelect: 0, maxSelect: undefined },
    });

    const modifierForm = useForm({
        resolver: zodResolver(modifierSchema),
        defaultValues: { modifierGroupId: "", name: "", price: 0, available: true },
    });

    // Reset forms when dialogs open/close
    useEffect(() => {
        if (isGroupDialogOpen) {
            if (editingGroup) {
                groupForm.reset({
                    name: editingGroup.name,
                    required: editingGroup.required,
                    multiSelect: editingGroup.multiSelect,
                    minSelect: editingGroup.minSelect,
                    maxSelect: editingGroup.maxSelect ?? undefined,
                });
            } else {
                groupForm.reset({ name: "", required: false, multiSelect: true, minSelect: 0, maxSelect: undefined });
            }
        }
    }, [isGroupDialogOpen, editingGroup, groupForm]);

    useEffect(() => {
        if (isModifierDialogOpen && selectedGroupId) {
            if (editingModifier) {
                modifierForm.reset({
                    modifierGroupId: selectedGroupId,
                    name: editingModifier.name,
                    price: editingModifier.price,
                    available: editingModifier.available,
                });
            } else {
                modifierForm.reset({ modifierGroupId: selectedGroupId, name: "", price: 0, available: true });
            }
        }
    }, [isModifierDialogOpen, editingModifier, selectedGroupId, modifierForm]);

    // Handlers
    const onGroupSubmit = (data: ModifierGroupInput) => {
        startTransition(async () => {
            const result = editingGroup ? await updateModifierGroup(editingGroup.id, data) : await createModifierGroup(productId, data);
            if (result.success) {
                toast.success(editingGroup ? "Grupo actualizado" : "Grupo creado");
                const newGroup = result.data as ModifierGroup;
                setLocalGroups(prev => {
                    if (editingGroup) {
                        return prev.map(g => (g.id === editingGroup.id ? { ...g, ...newGroup } : g));
                    } else {
                        return [...prev, newGroup];
                    }
                });
                groupForm.reset({ name: "", required: false, multiSelect: true, minSelect: 0, maxSelect: undefined });
            } else {
                toast.error(result.error);
            }
        });
    };

    const onModifierSubmit = (data: ModifierInput) => {
        startTransition(async () => {
            const result = editingModifier ? await updateModifier(editingModifier.id, data) : await createModifier(data);
            if (result.success) {
                toast.success(editingModifier ? "Modificador actualizado" : "Modificador creado");
                const newMod = result.data as Modifier;
                setLocalGroups(prev => {
                    return prev.map(g => {
                        if (g.id !== selectedGroupId) return g;
                        if (editingModifier) {
                            const updatedMods = g.modifiers.map(m => (m.id === editingModifier.id ? { ...m, ...newMod } : m));
                            return { ...g, modifiers: updatedMods };
                        } else {
                            return { ...g, modifiers: [...g.modifiers, newMod] };
                        }
                    });
                });
                modifierForm.reset({ modifierGroupId: selectedGroupId ?? "", name: "", price: 0, available: true });
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleDeleteGroup = (groupId: string) => {
        if (confirm("¿Estás seguro de eliminar este grupo y todos sus modificadores?")) {
            startTransition(async () => {
                const result = await deleteModifierGroup(productId, groupId);
                if (result.success) {
                    toast.success("Grupo eliminado");
                    setLocalGroups(prev => prev.filter(g => g.id !== groupId));
                } else {
                    toast.error(result.error);
                }
            });
        }
    };

    const handleDeleteModifier = (modifierId: string) => {
        if (confirm("¿Estás seguro de eliminar este modificador?")) {
            startTransition(async () => {
                const result = await deleteModifier(modifierId);
                if (result.success) {
                    toast.success("Modificador eliminado");
                    setLocalGroups(prev => {
                        return prev.map(g => {
                            const filtered = g.modifiers.filter(m => m.id !== modifierId);
                            return { ...g, modifiers: filtered };
                        });
                    });
                } else {
                    toast.error(result.error);
                }
            });
        }
    };

    const handleGroupDialogClose = (open: boolean) => {
        setIsGroupDialogOpen(open);
        if (!open) {
            setEditingGroup(null);
            if (!editingGroup) onRefresh();
        }
    };

    const handleModifierDialogClose = (open: boolean) => {
        setIsModifierDialogOpen(open);
        if (!open) {
            setEditingModifier(null);
            setSelectedGroupId(null);
            if (!editingModifier) onRefresh();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Grupos de Modificadores</h3>
                <Button onClick={() => { setEditingGroup(null); setIsGroupDialogOpen(true); }} size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Nuevo Grupo
                </Button>
            </div>

            <div className="space-y-2">
                {localGroups.length === 0 ? (
                    <div className="text-center py-8 border rounded-md text-muted-foreground">No hay grupos de modificadores</div>
                ) : (
                    <div className="space-y-2">
                        {localGroups.map(group => (
                            <CollapsibleGroup
                                key={group.id}
                                group={group}
                                onEditGroup={() => { setEditingGroup(group); setIsGroupDialogOpen(true); }}
                                onDeleteGroup={() => handleDeleteGroup(group.id)}
                                onAddModifier={() => { setSelectedGroupId(group.id); setEditingModifier(null); setIsModifierDialogOpen(true); }}
                                onEditModifier={(mod) => { setSelectedGroupId(group.id); setEditingModifier(mod); setIsModifierDialogOpen(true); }}
                                onDeleteModifier={(modId) => handleDeleteModifier(modId)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Group Dialog */}
            <Dialog open={isGroupDialogOpen} onOpenChange={handleGroupDialogClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingGroup ? "Editar Grupo" : "Nuevo Grupo"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={groupForm.handleSubmit(onGroupSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Grupo</Label>
                            <Input id="name" placeholder="Ej. Elige tu salsa" {...groupForm.register("name")} />
                            {groupForm.formState.errors.name && (
                                <p className="text-sm text-red-500">{groupForm.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Switch id="required" checked={groupForm.watch("required")} onCheckedChange={c => groupForm.setValue("required", c)} />
                                <Label htmlFor="required">Obligatorio</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="multiSelect" checked={groupForm.watch("multiSelect")} onCheckedChange={c => groupForm.setValue("multiSelect", c)} />
                                <Label htmlFor="multiSelect">Selección Múltiple</Label>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="minSelect">Mínimo</Label>
                                <Input id="minSelect" type="number" {...groupForm.register("minSelect")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxSelect">Máximo (Opcional)</Label>
                                <Input id="maxSelect" type="number" {...groupForm.register("maxSelect")} />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            {!editingGroup && (
                                <Button type="button" variant="outline" onClick={groupForm.handleSubmit((data) => {
                                    onGroupSubmit(data);
                                })} disabled={isPending}>
                                    Guardar y Crear Otro
                                </Button>
                            )}
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Guardando..." : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modifier Dialog */}
            <Dialog open={isModifierDialogOpen} onOpenChange={handleModifierDialogClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingModifier ? "Editar Opción" : "Nueva Opción"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={modifierForm.handleSubmit(onModifierSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="modName">Nombre</Label>
                            <Input id="modName" placeholder="Ej. Mayonesa" {...modifierForm.register("name")} />
                            {modifierForm.formState.errors.name && (
                                <p className="text-sm text-red-500">{modifierForm.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="modPrice">Precio Adicional</Label>
                            <Input id="modPrice" type="number" step="0.01" {...modifierForm.register("price")} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="modAvailable" checked={modifierForm.watch("available")} onCheckedChange={c => modifierForm.setValue("available", c)} />
                            <Label htmlFor="modAvailable">Disponible</Label>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            {!editingModifier && (
                                <Button type="button" variant="outline" onClick={modifierForm.handleSubmit((data) => {
                                    onModifierSubmit(data);
                                })} disabled={isPending}>
                                    Guardar y Crear Otro
                                </Button>
                            )}
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Guardando..." : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function CollapsibleGroup({
    group,
    onEditGroup,
    onDeleteGroup,
    onAddModifier,
    onEditModifier,
    onDeleteModifier,
}: {
    group: ModifierGroup;
    onEditGroup: () => void;
    onDeleteGroup: () => void;
    onAddModifier: () => void;
    onEditModifier: (m: Modifier) => void;
    onDeleteModifier: (id: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-md px-4 mb-2">
            <div className="flex items-center justify-between py-2">
                <CollapsibleTrigger className="flex-1 flex items-center hover:no-underline py-2 text-left">
                    {isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                    <div className="flex flex-col items-start">
                        <span className="font-medium">{group.name}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                            {group.required ? "Obligatorio" : "Opcional"} • {group.multiSelect ? "Selección múltiple" : "Selección única"}
                        </span>
                    </div>
                </CollapsibleTrigger>
                <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); onEditGroup(); }}>
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={e => { e.stopPropagation(); onDeleteGroup(); }}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <CollapsibleContent>
                <div className="pl-4 border-l-2 ml-2 space-y-2 py-2">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Opciones</h4>
                        <Button variant="outline" size="sm" onClick={onAddModifier}>
                            <Plus className="h-3 w-3 mr-1" />Agregar Opción
                        </Button>
                    </div>
                    {group.modifiers.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No hay opciones en este grupo</p>
                    ) : (
                        <div className="grid gap-2">
                            {group.modifiers.map(modifier => (
                                <div key={modifier.id} className="flex items-center justify-between bg-muted/30 p-2 rounded text-sm">
                                    <div className="flex items-center gap-2">
                                        <span>{modifier.name}</span>
                                        {modifier.price > 0 && (
                                            <span className="text-muted-foreground">+{formatCurrency(modifier.price)}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditModifier(modifier)}>
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onDeleteModifier(modifier.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
