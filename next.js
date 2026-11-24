// ===== 1. BANTUAN LOCALSTORAGE =====
function ambilData(kunci) {
  const data = localStorage.getItem(kunci);
  return data ? JSON.parse(data) : [];
}

function simpanData(kunci, isi) {
  localStorage.setItem(kunci, JSON.stringify(isi));
}

// ===== 2. MODE GELAP / TERANG =====
function muatTema() {
  const tema = localStorage.getItem("tema") || "light";
  document.documentElement.setAttribute("data-theme", tema);
}

function gantiTema() {
  const sekarang = document.documentElement.getAttribute("data-theme");
  const baru = sekarang === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", baru);
  localStorage.setItem("tema", baru);
}

// ===== 3. LOGIN & REGISTER =====
let modeDaftar = false;
let proyekAktifId = null;

function gantiModeAuth() {
  modeDaftar = !modeDaftar;
  document.getElementById("authTitle").textContent = modeDaftar ? "Daftar Akun" : "Login";
  document.getElementById("authBtn").textContent = modeDaftar ? "Daftar" : "Masuk";
  document.getElementById("toggleText").textContent = modeDaftar ? "Sudah punya akun?" : "Belum punya akun?";
  document.getElementById("namaField").classList.toggle("sembunyi", !modeDaftar);
}

document.getElementById("authForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const nama = document.getElementById("inputNama").value.trim();
  const username = document.getElementById("inputUser").value.trim();
  const password = document.getElementById("inputPass").value.trim();

  // Validasi input
  if (username.length < 3 || password.length < 4) {
    alert("Username minimal 3 huruf dan password minimal 4 karakter.");
    return;
  }

  const users = ambilData("users");

  if (modeDaftar) {
    if (!nama) {
      alert("Nama wajib diisi saat daftar.");
      return;
    }
    const sudahAda = users.find((u) => u.username === username);
    if (sudahAda) {
      alert("Username sudah dipakai.");
      return;
    }

    users.push({ id: String(Date.now()), nama, username, password });
    simpanData("users", users);
    alert("Daftar berhasil! Silakan login.");
    gantiModeAuth();
    this.reset();
  } else {
    const cocok = users.find((u) => u.username === username && u.password === password);
    if (!cocok) {
      alert("Username atau password salah.");
      return;
    }

    localStorage.setItem("userLogin", JSON.stringify(cocok));
    alert("Login berhasil!");
    cekStatusLogin();
  }
});

function logout() {
  localStorage.removeItem("userLogin");
  proyekAktifId = null;
  cekStatusLogin();
}

function cekStatusLogin() {
  const user = JSON.parse(localStorage.getItem("userLogin"));
  if (!user) {
    document.getElementById("authBox").classList.remove("sembunyi");
    document.getElementById("dashboardBox").classList.add("sembunyi");
  } else {
    document.getElementById("authBox").classList.add("sembunyi");
    document.getElementById("dashboardBox").classList.remove("sembunyi");
    document.getElementById("labelUser").textContent = "Halo, " + user.nama;
    tampilkanSemua();
  }
}

// ===== 4. PROYEK (CRUD) =====
document.getElementById("formProyek").addEventListener("submit", function (e) {
  e.preventDefault();

  const user = JSON.parse(localStorage.getItem("userLogin"));
  const editId = document.getElementById("proyekEditId").value;
  const nama = document.getElementById("namaProyek").value.trim();
  const deskripsi = document.getElementById("deskripsiProyek").value.trim();
  const deadline = document.getElementById("deadlineProyek").value;
  const status = document.getElementById("statusProyek").value;

  if (!nama || !deskripsi || !deadline) {
    alert("Semua kolom proyek wajib diisi.");
    return;
  }

  let proyekList = ambilData("proyek");

  if (editId) {
    proyekList = proyekList.map((p) =>
      p.id === editId ? { ...p, nama, deskripsi, deadline, status } : p
    );
    alert("Proyek berhasil diubah.");
  } else {
    const baru = {
      id: String(Date.now()),
      userId: user.id,
      nama,
      deskripsi,
      deadline,
      status
    };
    proyekList.push(baru);
    proyekAktifId = baru.id;
    alert("Proyek berhasil ditambahkan.");
  }

  simpanData("proyek", proyekList);
  resetFormProyek();
  tampilkanSemua();
});

function editProyek(id) {
  const proyek = ambilData("proyek").find((p) => p.id === id);
  if (!proyek) return;

  document.getElementById("proyekEditId").value = proyek.id;
  document.getElementById("namaProyek").value = proyek.nama;
  document.getElementById("deskripsiProyek").value = proyek.deskripsi;
  document.getElementById("deadlineProyek").value = proyek.deadline;
  document.getElementById("statusProyek").value = proyek.status;
  document.getElementById("btnSimpanProyek").textContent = "Simpan Perubahan";
  document.getElementById("btnBatalProyek").classList.remove("sembunyi");
}

function resetFormProyek() {
  document.getElementById("formProyek").reset();
  document.getElementById("proyekEditId").value = "";
  document.getElementById("btnSimpanProyek").textContent = "Tambah Proyek";
  document.getElementById("btnBatalProyek").classList.add("sembunyi");
}

function hapusProyek(id) {
  const yakin = confirm("Hapus proyek ini? Semua tugas di dalamnya juga akan terhapus.");
  if (!yakin) return;

  const sisaProyek = ambilData("proyek").filter((p) => p.id !== id);
  const sisaTugas = ambilData("tugas").filter((t) => t.projectId !== id);

  simpanData("proyek", sisaProyek);
  simpanData("tugas", sisaTugas);

  if (proyekAktifId === id) {
    proyekAktifId = null;
    document.getElementById("judulProyekAktif").textContent = "Pilih proyek dulu";
    document.getElementById("infoProyekAktif").textContent = "";
    document.getElementById("areaTugas").classList.add("sembunyi");
  }

  alert("Proyek dan tugas di dalamnya berhasil dihapus.");
  tampilkanSemua();
}

function pilihProyek(id) {
  proyekAktifId = id;
  const proyek = ambilData("proyek").find((p) => p.id === id);
  if (!proyek) return;

  document.getElementById("judulProyekAktif").textContent = "Tugas: " + proyek.nama;
  document.getElementById("infoProyekAktif").textContent =
    proyek.deskripsi + " | Deadline: " + proyek.deadline + " | Status: " + proyek.status;
  document.getElementById("areaTugas").classList.remove("sembunyi");

  resetFormTugas();
  tampilkanProyek();
  tampilkanTugas();
}

function tampilkanProyek() {
  const user = JSON.parse(localStorage.getItem("userLogin"));
  const proyekUser = ambilData("proyek").filter((p) => p.userId === user.id);
  const wadah = document.getElementById("daftarProyek");

  if (proyekUser.length === 0) {
    wadah.innerHTML = '<p class="teks-redup">Belum ada proyek.</p>';
    return;
  }

  wadah.innerHTML = proyekUser
    .map(
      (p) => `
      <div class="item-card ${p.id === proyekAktifId ? "item-aktif" : ""}">
        <strong>${p.nama}</strong> (${p.status})
        <p class="teks-redup">${p.deskripsi}</p>
        <small>Deadline: ${p.deadline}</small><br/>
        <button type="button" class="btn-kecil" onclick="pilihProyek('${p.id}')">Buka Tugas</button>
        <button type="button" class="btn-kecil btn-abu" onclick="editProyek('${p.id}')">Edit</button>
        <button type="button" class="btn-kecil btn-merah" onclick="hapusProyek('${p.id}')">Hapus</button>
      </div>
    `
    )
    .join("");
}

// ===== 5. TUGAS (CRUD + LAMPIRAN + FILTER) =====
document.getElementById("formTugas").addEventListener("submit", function (e) {
  e.preventDefault();

  if (!proyekAktifId) {
    alert("Pilih proyek terlebih dahulu.");
    return;
  }

  const editId = document.getElementById("tugasEditId").value;
  const judul = document.getElementById("judulTugas").value.trim();
  const deskripsi = document.getElementById("deskripsiTugas").value.trim();
  const deadline = document.getElementById("deadlineTugas").value;
  const status = document.getElementById("statusTugas").value;
  const file = document.getElementById("fileTugas").files[0];

  if (!judul || !deskripsi || !deadline) {
    alert("Judul, deskripsi, dan deadline tugas wajib diisi.");
    return;
  }

  function lanjutSimpan(lampiranBaru) {
    let daftarTugas = ambilData("tugas");

    if (editId) {
      daftarTugas = daftarTugas.map((t) => {
        if (t.id !== editId) return t;
        return {
          ...t,
          judul,
          deskripsi,
          deadline,
          status,
          lampiran: lampiranBaru !== undefined ? lampiranBaru : t.lampiran
        };
      });
      alert("Tugas berhasil diubah.");
    } else {
      daftarTugas.push({
        id: String(Date.now()),
        projectId: proyekAktifId,
        judul,
        deskripsi,
        deadline,
        status,
        lampiran: lampiranBaru || null
      });
      alert("Tugas berhasil ditambahkan.");
    }

    simpanData("tugas", daftarTugas);
    resetFormTugas();
    tampilkanSemua();
  }

  if (file) {
    if (file.size > 1024 * 1024) {
      alert("Ukuran file maksimal 1MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      lanjutSimpan({ nama: file.name, url: reader.result });
    };
    reader.readAsDataURL(file);
  } else {
    lanjutSimpan(undefined);
  }
});

function editTugas(id) {
  const tugas = ambilData("tugas").find((t) => t.id === id);
  if (!tugas) return;

  document.getElementById("tugasEditId").value = tugas.id;
  document.getElementById("judulTugas").value = tugas.judul;
  document.getElementById("deskripsiTugas").value = tugas.deskripsi;
  document.getElementById("deadlineTugas").value = tugas.deadline;
  document.getElementById("statusTugas").value = tugas.status;
  document.getElementById("btnSimpanTugas").textContent = "Simpan Perubahan";
  document.getElementById("btnBatalTugas").classList.remove("sembunyi");
}

function resetFormTugas() {
  document.getElementById("formTugas").reset();
  document.getElementById("tugasEditId").value = "";
  document.getElementById("btnSimpanTugas").textContent = "Tambah Tugas";
  document.getElementById("btnBatalTugas").classList.add("sembunyi");
}

function hapusTugas(id) {
  const yakin = confirm("Yakin ingin menghapus tugas ini?");
  if (!yakin) return;

  const sisa = ambilData("tugas").filter((t) => t.id !== id);
  simpanData("tugas", sisa);
  alert("Tugas berhasil dihapus.");
  tampilkanSemua();
}

function tampilkanTugas() {
  if (!proyekAktifId) return;

  const kataCari = document.getElementById("cariTugas").value.toLowerCase();
  const statusFilter = document.getElementById("filterStatus").value;
  const wadah = document.getElementById("daftarTugas");

  let tugasProyek = ambilData("tugas").filter((t) => t.projectId === proyekAktifId);

  if (statusFilter !== "Semua") {
    tugasProyek = tugasProyek.filter((t) => t.status === statusFilter);
  }

  if (kataCari) {
    tugasProyek = tugasProyek.filter(
      (t) =>
        t.judul.toLowerCase().includes(kataCari) ||
        t.deskripsi.toLowerCase().includes(kataCari)
    );
  }

  if (tugasProyek.length === 0) {
    wadah.innerHTML = '<p class="teks-redup">Tidak ada tugas yang cocok.</p>';
    return;
  }

  wadah.innerHTML = tugasProyek
    .map((t) => {
      const linkLampiran = t.lampiran
        ? `<br/><a href="${t.lampiran.url}" download="${t.lampiran.nama}">Lampiran: ${t.lampiran.nama}</a>`
        : "";

      return `
        <div class="item-card">
          <strong>${t.judul}</strong> — <span>${t.status}</span>
          <p class="teks-redup">${t.deskripsi}</p>
          <small>Deadline: ${t.deadline}</small>
          ${linkLampiran}<br/>
          <button type="button" class="btn-kecil btn-abu" onclick="editTugas('${t.id}')">Edit</button>
          <button type="button" class="btn-kecil btn-merah" onclick="hapusTugas('${t.id}')">Hapus</button>
        </div>
      `;
    })
    .join("");
}

// ===== 6. RINGKASAN & DEADLINE DEKAT =====
function tampilkanRingkasan() {
  const user = JSON.parse(localStorage.getItem("userLogin"));
  const proyekUser = ambilData("proyek").filter((p) => p.userId === user.id);
  const idProyekUser = proyekUser.map((p) => p.id);
  const tugasUser = ambilData("tugas").filter((t) => idProyekUser.includes(t.projectId));

  document.getElementById("totalProyek").textContent = proyekUser.length;
  document.getElementById("totalTodo").textContent = tugasUser.filter((t) => t.status === "To-do").length;
  document.getElementById("totalProgress").textContent = tugasUser.filter((t) => t.status === "In-Progress").length;
  document.getElementById("totalDone").textContent = tugasUser.filter((t) => t.status === "Done").length;

  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);

  const dekat = tugasUser.filter((t) => {
    if (t.status === "Done") return false;
    const selisihHari = (new Date(t.deadline) - hariIni) / (1000 * 60 * 60 * 24);
    return selisihHari <= 3;
  });

  const ul = document.getElementById("daftarDeadlineDekat");
  if (dekat.length === 0) {
    ul.innerHTML = "<li>Tidak ada tugas mendekati deadline.</li>";
  } else {
    ul.innerHTML = dekat
      .map((t) => `<li>${t.judul} (Deadline: ${t.deadline} - ${t.status})</li>`)
      .join("");
  }
}

function tampilkanSemua() {
  tampilkanRingkasan();
  tampilkanProyek();
  if (proyekAktifId) {
    tampilkanTugas();
  }
}

// Jalankan saat halaman dibuka
muatTema();
cekStatusLogin();