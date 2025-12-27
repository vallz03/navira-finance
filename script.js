var firebaseConfig = {
    apiKey: "API_KEY_KAMU",
    authDomain: "PROJECT_ID.firebaseapp.com",
    databaseURL: "https://navira-finance-default-rtdb.firebaseio.com/",
    projectId: "PROJECT_ID",
    storageBucket: "PROJECT_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.database();

let currentUser = null;
let editId = null;

function sapaan() {
    const jam = new Date().getHours();

    if (jam >= 5 && jam <= 11.59) {
        return "Halo, Selamat pagi";
    } else if (jam >= 12 && jam <= 14.59) {
        return "Halo, Selamat siang";
    } else if (jam >= 15 && jam <= 17.59) {
        return "Halo, Selamat sore";
    } else {
        return "Halo, Selamat malam";
    }
}

function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Username & Password wajib diisi!");
        return;
    }

    db.ref("Navira_admin/" + username).once("value", snap => {
        if (snap.exists()) {
            if (snap.val().password === password) {
                currentUser = username;
                currentRole = "admin";
                alert(`${sapaan()}, Admin ${username}`);
                loadAll();
            } else alert("Password admin salah!");
            return;
        }

        db.ref("user/" + username).once("value", snap2 => {
            if (!snap2.exists()) {
                alert("Akun tidak ditemukan!");
                return;
            }
            if (snap2.val().password !== password) {
                alert("Password salah!");
                return;
            }

            currentUser = username;
            currentRole = "user";
            alert(`${sapaan()}, ${username}`);
            loadAll();
        });
    });
}

function ubahsandi() {
    const msg = document.getElementById("msgSandi");
    msg.style.color = "red";

    if (!currentUser || !currentRole) {
        alert("Silakan login terlebih dahulu!");
        return;
    }

    const sandiBaru = document.getElementById("ubahsandi").value.trim();
    const konfirmasi = document.getElementById("konfirmasiSandi").value.trim();

    if (!sandiBaru || !konfirmasi) {
        alert("Semua data wajib diisi!");
        return;
    }

    if (sandiBaru !== konfirmasi) {
        alert("Konfirmasi sandi tidak cocok!");
        return;
    }

    const regexAman =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!regexAman.test(sandiBaru)) {
       alert("Sandi lemah! Minimal 8 karakter, huruf besar, kecil, angka & simbol");
        return;
    }

    const path = currentRole === "admin"
        ? `Navira_admin/${currentUser}`
        : `user/${currentUser}`;

    db.ref(path).update({
        password: sandiBaru
    }).then(() => {
        msg.style.color = "green";
        alert("Sandi berhasil diubah!");

        document.getElementById("ubahsandi").value = "";
        document.getElementById("konfirmasiSandi").value = "";
    }).catch(err => {
        console.error(err);
        alert("Gagal mengubah sandi");
    });
}

function daftar() {
    const user = username.value;
    const pass = document.getElementById("password").value;

    if (!user || !pass) {
        alert("Semua data wajib diisi");
        return;
    }

    db.ref("user/" + user).once("value", snap => {
        if (snap.exists()) {
            alert("❌ User sudah ada");
        } else {
            db.ref("user/" + user).set({ password: pass });
            alert("✅ User berhasil dibuat");
        }
    });
}

function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (input.type === "password") {
        input.type = "text";        
        icon.textContent = "👁️";   
    } else {
        input.type = "password";   
        icon.textContent = "🔒";   
    }
}

function logout() {
    if (!currentUser) {
        alert("Anda belum login!");
        return;
    }

    currentUser = null;
    currentRole = null;

    document.getElementById("total-balance").innerText = "Rp 0";
    document.getElementById("total-income").innerText = "Rp 0";
    document.getElementById("pengeluaran").innerText = "Rp 0";

    const riwayat = document.getElementById("riwayat");
    if (riwayat) riwayat.innerHTML = "<h3>Riwayat</h3>";

    document.getElementById("username").value = "";
    document.getElementById("pass").value = "";

    alert("Logout berhasil!");

    location.hash = "#login";
}

function formatRupiah(angka) {
    return "Rp " + Number(angka).toLocaleString("id-ID");
}

function simpan() {
    if (!currentUser) {
        alert("Silakan login!");
        return;
    }

    const data = {
        jenis: jenis.value,
        tanggal: tanggal.value,
        metode: metode.value.trim(),
        kategori: kategori.value.trim(),
        desk: desk.value.trim(),
        nominal: parseInt(nominal.value),
        waktu: Date.now()
    };

    if (!data.tanggal || !data.metode || !data.kategori || !data.desk || !data.nominal) {
        alert("Semua data wajib diisi!");
        return;
    }

    const ref = editId
        ? db.ref(`transaksi/${currentUser}/${editId}`)
        : db.ref(`transaksi/${currentUser}`).push();

    ref.set(data).then(() => {
        alert("Transaksi tersimpan!");
        editId = null;
        loadAll();
    });
}

function loadRiwayat() {
    if (!currentUser) return;

    const tbody = document.querySelector("#datariwayat tbody");
    tbody.innerHTML = "";

    db.ref("transaksi/" + currentUser)
        .orderByChild("waktu")
        .once("value", snap => {
            snap.forEach(child => {
                const d = child.val();
                const key = child.key;

                tbody.innerHTML += `
                    <tr>
                        <td>${d.tanggal}</td>
                        <td>${d.jenis}</td>
                        <td>${d.metode}</td>
                        <td>${d.kategori}</td>
                        <td>${d.desk}</td>
                        <td>${formatRupiah(d.nominal)}</td>
                        <td><button onclick="edit('${key}')">Edit</button>
                            <button onclick="hapus('${key}')">Hapus</button>
                            </td>
                    </tr>
                `;
            });
        });
}

function edit(key) {
    db.ref(`transaksi/${currentUser}/${key}`).once("value", snap => {
        const d = snap.val();
        jenis.value = d.jenis;
        tanggal.value = d.tanggal;
        metode.value = d.metode;
        kategori.value = d.kategori;
        desk.value = d.desk;
        nominal.value = d.nominal;
        editId = key;
    });
}

function hapus(key) {
    if (confirm("Hapus transaksi ini?")) {
        db.ref(`transaksi/${currentUser}/${key}`).remove()
            .then(loadAll);
    }
}

/* ================================
   BATAS PENGELUARAN
================================ */
const batasPengeluaran = 100000; // Rp 100.000

/* ================================
   DASHBOARD + PERINGATAN + REKOMENDASI (FIX FINAL)
================================ */
function updateDashboard() {
    if (!currentUser) return;

    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    const elIncome = document.getElementById("total-income");
    const elExpense = document.getElementById("pengeluaran");
    const elBalance = document.getElementById("total-balance");

    const card = document.getElementById("peringatan");
    const msgBox = document.getElementById("alert-message");
    const recList = document.getElementById("alert-recommend-list");

    // Reset UI
    card.classList.add("hidden");
    msgBox.innerHTML = "";
    recList.innerHTML = "";

    db.ref("transaksi/" + currentUser).once("value", snapshot => {
        snapshot.forEach(child => {
            const d = child.val();
            const nominal = parseInt(d.nominal) || 0;

            if (d.jenis === "pemasukan") {
                totalPemasukan += nominal;
            } else if (d.jenis === "pengeluaran") {
                totalPengeluaran += nominal;
            }
        });

        const saldo = totalPemasukan - totalPengeluaran;

        // Update angka dashboard
        elIncome.innerText = formatRupiah(totalPemasukan);
        elExpense.innerText = formatRupiah(totalPengeluaran);
        elBalance.innerText = formatRupiah(saldo);

        /* =========================
           LOGIKA PERINGATAN
        ========================= */
        let pesan = [];
        let rekomendasi = [];

        if (totalPengeluaran > batasPengeluaran) {
            pesan.push(`Pengeluaran Anda telah melebihi batas <b>${formatRupiah(batasPengeluaran)}</b>.`);
            rekomendasi.push("Tetapkan batas belanja harian");
        }

        if (totalPengeluaran > totalPemasukan) {
            pesan.push("Pengeluaran lebih besar dari pemasukan.");
            rekomendasi.push("Kurangi belanja non-prioritas");
        }

        if (totalPemasukan > 0 && totalPengeluaran >= totalPemasukan * 0.8) {
            pesan.push("Pengeluaran sudah mencapai 80% dari pemasukan.");
            rekomendasi.push("Tunda pembelian besar sementara");
        }

        if (saldo <= 0) {
            pesan.push("Saldo Anda berada pada kondisi kritis.");
            rekomendasi.push("Gunakan metode pembayaran tunai");
        }

        if (pesan.length > 0) {
            card.classList.remove("hidden");
            msgBox.innerHTML = pesan.map(p => `• ${p}`).join("<br>");

            rekomendasi.forEach(r => {
                recList.innerHTML += `<li>${r}</li>`;
            });
        }
    });
}

function loadAll() {
    loadRiwayat();
    updateDashboard();
}

function terapkan() {
    if (!currentUser) return;

    const j = filterJenis.value;
    const m = filterMetode.value.toLowerCase();
    const k = filterKategori.value.toLowerCase();
    const tA = tglAwal.value;
    const tB = tglAkhir.value;

    const tbody = document.querySelector("#datariwayat tbody");
    tbody.innerHTML = "";

    db.ref("transaksi/" + currentUser).once("value", snap => {
        snap.forEach(item => {
            const d = item.val();

            if (
                (j && d.jenis !== j) ||
                (m && !d.metode.toLowerCase().includes(m)) ||
                (k && !d.kategori.toLowerCase().includes(k)) ||
                (tA && d.tanggal < tA) ||
                (tB && d.tanggal > tB)
            ) return;

            tbody.innerHTML += `
                <tr>
                    <td>${d.tanggal}</td>
                    <td>${d.jenis}</td>
                    <td>${d.metode}</td>
                    <td>${d.kategori}</td>
                    <td>${d.desk}</td>
                    <td>Rp ${d.nominal.toLocaleString()}</td>
                    <td>${d.jenis}</td>
                    <td>-</td>
                </tr>
            `;
        });
    });
}

function reset() {
    if (!currentUser) return;

    // Reset input filter
    document.getElementById("filterJenis").value = "";
    document.getElementById("filterMetode").value = "";
    document.getElementById("filterKategori").value = "";
    document.getElementById("tglAwal").value = "";
    document.getElementById("tglAkhir").value = "";

    loadRiwayat();
}

const btnTheme = document.getElementById("theme-toogle");
btnTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    btnTheme.innerText =
        document.body.classList.contains("dark") ? "☀️ Light" : "🌙 Dark";
});
