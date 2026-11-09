Borrado:
        <Filter label="Duración" options={["Todas", "<30", "30–60", ">60"]} suffix=" min" value={duration} onChange={setDuration} />
        <Filter label="Género" options={["Todos", ...genres]} value={genre} onChange={setGenre} />
        