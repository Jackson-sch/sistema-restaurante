export default function Page() {
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
      <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
        <span className="text-muted-foreground">Resumen de Ventas</span>
      </div>
      <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
        <span className="text-muted-foreground">Pedidos Activos</span>
      </div>
      <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
        <span className="text-muted-foreground">Mesas Ocupadas</span>
      </div>
      <div className="bg-muted/50 min-h-[50vh] flex-1 rounded-xl col-span-3 p-6">
        <h2 className="text-2xl font-bold mb-4">Bienvenido al Sistema</h2>
        <p className="text-muted-foreground">Selecciona una opción del menú lateral para comenzar.</p>
      </div>
    </div>
  )
}

