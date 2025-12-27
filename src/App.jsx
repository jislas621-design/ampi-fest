import fondo from "./assets/fondo.jpg";
import gifCorner from "./assets/ampi_fest_corner.gif";
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const EVENTO = "✨ Ampi Fest – 15 Años ✨";
const BEBIDAS = ["Viña", "Lata", "Gancia", "Fernet", "Gaseosa"];

const CLAVE_BARMAN = "barman123";
const CLAVE_ORGANIZADOR = "orga123";

export default function App() {
  const [rol, setRol] = useState(null);
  const [clave, setClave] = useState("");

  const [nombre, setNombre] = useState(
    localStorage.getItem("nombreInvitado") || ""
  );

  const [nombreBloqueado, setNombreBloqueado] = useState(
    !!localStorage.getItem("nombreInvitado")
  );

  const [bebida, setBebida] = useState("");

  const [usuarios, setUsuarios] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);

  useEffect(() => {
    const u = onSnapshot(collection(db, "usuarios"), snap =>
      setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const s = onSnapshot(collection(db, "solicitudes"), snap =>
      setSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      u();
      s();
    };
  }, []);

  const resetRol = () => {
    setRol(null);
    setClave("");
  };

  /* ================= INVITADO ================= */

  const pedir = async () => {
    if (!nombre || !bebida) return;

    // 🔒 Guardar nombre solo una vez
    if (!nombreBloqueado) {
      localStorage.setItem("nombreInvitado", nombre);
      setNombreBloqueado(true);
    }

    // 🔢 Contar TODAS las bebidas alcohólicas del invitado
    const totalAlcohol = solicitudes.filter(
      s =>
        s.nombre === nombre &&
        s.bebida !== "Gaseosa" &&
        ["pendiente", "aprobada", "entregado"].includes(s.estado)
    ).length;

    let estado = "pendiente";

    if (bebida === "Gaseosa") estado = "aprobada";
    else if (totalAlcohol < 2) estado = "aprobada";

    await addDoc(collection(db, "solicitudes"), {
      nombre,
      bebida,
      estado,
      creada: new Date()
    });

    setBebida("");
  };

  /* ================= ORGANIZADOR ================= */

  const aprobar = async s => {
    await updateDoc(doc(db, "solicitudes", s.id), {
      estado: "aprobada"
    });
  };

  /* ================= BARMAN ================= */

  const entregar = async s => {
    const hora = new Date();

    await updateDoc(doc(db, "solicitudes", s.id), {
      estado: "entregado",
      horaEntrega: hora
    });

    const u = usuarios.find(x => x.nombre === s.nombre);

    if (u) {
      await updateDoc(doc(db, "usuarios", u.id), {
        consumidos: [...(u.consumidos || []), { bebida: s.bebida, hora }]
      });
    } else {
      await addDoc(collection(db, "usuarios"), {
        nombre: s.nombre,
        consumidos: [{ bebida: s.bebida, hora }]
      });
    }
  };

  /* ================= REPORTE ================= */

  const generarReporte = () => {
    let csv = "Nombre,Bebida,Hora\n";

    usuarios.forEach(u => {
      (u.consumidos || []).forEach(c => {
        const hora = c.hora?.seconds
          ? new Date(c.hora.seconds * 1000).toLocaleTimeString()
          : "";
        csv += `${u.nombre},${c.bebida},${hora}\n`;
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reporte_ampifest.csv";
    link.click();
  };

  /* ================= PANTALLAS ================= */

  if (!rol) {
    return (
      <Screen>
        <Title>{EVENTO}</Title>
        <Card>
          <BigButton onClick={() => setRol("invitado")}>Invitado</BigButton>
          <BigButton onClick={() => setRol("barman")}>Barman</BigButton>
          <BigButton onClick={() => setRol("organizador")}>Organizador</BigButton>
        </Card>
      </Screen>
    );
  }

  if (rol === "invitado") {
    return (
      <Screen>
        <Title>Invitado</Title>

        <Card>
          <Input
            placeholder="Tu nombre"
            value={nombre}
            disabled={nombreBloqueado}
            onChange={e => setNombre(e.target.value)}
          />

          <Select value={bebida} onChange={e => setBebida(e.target.value)}>
            <option value="">Elegí bebida</option>
            {BEBIDAS.map(b => (
              <option key={b}>{b}</option>
            ))}
          </Select>

          <BigButton onClick={pedir}>Solicitar bebida</BigButton>
        </Card>

        <Card>
          {solicitudes
            .filter(s => s.nombre === nombre)
            .map(s => (
              <Item key={s.id}>
                {s.bebida} — {s.estado}
              </Item>
            ))}
        </Card>

        <BackButton onClick={resetRol} />
      </Screen>
    );
  }

  if (rol === "organizador") {
    if (clave !== CLAVE_ORGANIZADOR) {
      return (
        <Screen>
          <Card>
            <Input
              type="password"
              placeholder="Clave organizador"
              value={clave}
              onChange={e => setClave(e.target.value)}
            />
            <BackButton onClick={resetRol} />
          </Card>
        </Screen>
      );
    }

    return (
      <Screen>
        <Title>Organizador</Title>

        <Card>
          <h3>Solicitudes pendientes</h3>
          {solicitudes.filter(s => s.estado === "pendiente").map(s => {
            const consumidos =
              usuarios.find(u => u.nombre === s.nombre)?.consumidos || [];

            return (
              <Item key={s.id}>
                <strong>{s.nombre}</strong> — {s.bebida}
                <div style={{ fontSize: 14 }}>
                  Consumidas: {consumidos.length}
                </div>
                <SmallButton onClick={() => aprobar(s)}>Aprobar</SmallButton>
              </Item>
            );
          })}
        </Card>

        <BigButton onClick={generarReporte}>Generar reporte</BigButton>
        <BackButton onClick={resetRol} />
      </Screen>
    );
  }

  if (rol === "barman") {
    if (clave !== CLAVE_BARMAN) {
      return (
        <Screen>
          <Card>
            <Input
              type="password"
              placeholder="Clave barman"
              value={clave}
              onChange={e => setClave(e.target.value)}
            />
            <BackButton onClick={resetRol} />
          </Card>
        </Screen>
      );
    }

    return (
      <Screen>
        <Title>Barman</Title>

        <Card>
          {solicitudes.filter(s => s.estado === "aprobada").map(s => (
            <Item key={s.id}>
              {s.nombre} — {s.bebida}
              <SmallButton onClick={() => entregar(s)}>Entregar</SmallButton>
            </Item>
          ))}
        </Card>

        <BackButton onClick={resetRol} />
      </Screen>
    );
  }

  return null;
}

/* ================= UI ================= */

const Screen = ({ children }) => (
  <div style={styles.screen}>
    <div style={styles.app}>{children}</div>
  </div>
);

const Card = ({ children }) => <div style={styles.card}>{children}</div>;
const Title = ({ children }) => <h1 style={styles.title}>{children}</h1>;
const Item = ({ children }) => <div style={styles.item}>{children}</div>;
const Input = props => <input {...props} style={styles.input} />;
const Select = props => <select {...props} style={styles.input} />;
const BigButton = props => <button {...props} style={styles.big} />;
const SmallButton = props => <button {...props} style={styles.small} />;
const BackButton = ({ onClick }) => (
  <button onClick={onClick} style={styles.back}>
    ⬅ Volver
  </button>
);

const styles = {
  screen: {
  minHeight: "100vh",
  backgroundImage: `url(${fondo})`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
  backgroundSize: "contain", // 👈 CLAVE para que se vea completa
  backgroundColor: "#000",   // relleno negro elegante
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 16
},

  app: {
    width: "100%",
    maxWidth: 420, // tamaño tipo celular
    color: "white"
  },

  title: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 20,
    background: "linear-gradient(90deg,#f472b6,#fb7185,#facc15)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 0 12px rgba(255,255,255,0.4)"
  },

  card: {
    background: "rgba(0,0,0,0.65)",
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    backdropFilter: "blur(8px)"
  },

  item: {
    background: "rgba(255,255,255,0.18)",
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    fontSize: 15
  },

  input: {
    width: "100%",
    padding: 16,
    marginBottom: 12,
    borderRadius: 14,
    border: "none",
    fontSize: 16
  },

  big: {
    width: "100%",
    padding: 18,
    marginBottom: 12,
    borderRadius: 18,
    border: "none",
    fontSize: 18,
    fontWeight: "700",
    background: "linear-gradient(135deg,#ec4899,#f43f5e)",
    color: "white"
  },

  small: {
    marginLeft: 10,
    padding: "8px 14px",
    borderRadius: 12,
    border: "none",
    background: "#22c55e",
    color: "black",
    fontWeight: "600"
  },

  back: {
    width: "100%",
    padding: 16,
    borderRadius: 18,
    border: "none",
    background: "#6b7280",
    color: "white",
    fontSize: 16,
    fontWeight: "600"
  }
};
   <img
  src={gifCorner}
  alt="Ampi Fest"
  style={{
    position: "fixed",
    bottom: 12,
    right: 12,
    width: 90,
    zIndex: 50,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,.35)"
  }}
/>