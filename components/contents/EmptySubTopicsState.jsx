

const EmptySubTopicsState = () => {
    return (
        <div className="rounded-lg border border-dashed p-6">
            <p className="text-sm font-medium">Nincs kiválasztott témakör</p>
            <p className="mt-1 text-sm text-muted-foreground">
                Válassz egy témakört a fenti listából, és itt megjelennek az <span className="font-medium">EMBEDDED</span>{" "}
                altémák és a hozzájuk tartozó chunkok.
            </p>
        </div>
    );
}

export default EmptySubTopicsState