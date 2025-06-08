document.addEventListener("DOMContentLoaded", () => {
    const veriGirdisi = document.getElementById("veri-girdisi");
    const hammingGosterim = document.getElementById("hamming-gosterim");

    // Veri uzunluğu değişimini dinle
    document.querySelector('#veri-uzunlugu').addEventListener('change', (e) => {
        const uzunluk = parseInt(e.target.value);
        veriGirdisi.maxLength = uzunluk;
        veriGirdisi.placeholder = `${uzunluk} bit uzunluğunda veri girin`;
        veriGirdisi.value = '';
        hammingGosterim.innerHTML = '';
        ['bellek-verisi', 'hatali-veri', 'duzeltilmis-veri', 'sendrom', 'hatali-bit'].forEach(id => {
            document.getElementById(id).textContent = '';
        });
        window.bellekVerisi = window.guncelVeri = window.hatalıVeri = "";
    });

    // Hata seçenekleri kontrolü
    document.querySelectorAll('input[name="hata-sayisi"]').forEach(radio => {
        radio.addEventListener('change', () => {
            document.getElementById("tek-hata-girdisi").style.display = 
                radio.value === "1" ? "block" : "none";
            document.getElementById("cift-hata-girdisi").style.display = 
                radio.value === "2" ? "block" : "none";
        });
    });

    window.hammingUret = function() {
        const uzunluk = parseInt(document.querySelector('#veri-uzunlugu').value);
        const veri = veriGirdisi.value.trim();

        if (!/^[01]+$/.test(veri) || veri.length !== uzunluk) {
            alert(`Lütfen ${uzunluk} bit uzunluğunda, sadece 0 ve 1 içeren bir veri girin.`);
            return;
        }

        const hammingliVeri = hammingKodla(veri);
        window.bellekVerisi = hammingliVeri;
        window.guncelVeri = hammingliVeri;
        window.hatalıVeri = "";

        // Sağdan sola gösterim için reverse
        document.getElementById("bellek-verisi").textContent = hammingliVeri.split('').reverse().join('');
        gosterHamming(hammingliVeri);
    };

    window.hataEkle = function() {
        if (!window.guncelVeri) {
            alert("Önce Hamming kodu üretmelisiniz.");
            return;
        }

        const uzunluk = window.guncelVeri.length;
        const secim = document.querySelector('input[name="hata-sayisi"]:checked').value;
        let hataliIndexler = [];

        if (secim === "1") {
            const konum = parseInt(document.getElementById("hata-konumu").value);
            if (isNaN(konum) || konum < 1 || konum > uzunluk) {
                alert(`Geçerli bir konum girin (1 - ${uzunluk})`);
                return;
            }
            hataliIndexler.push(konum - 1);
        } else {
            const konum1 = parseInt(document.getElementById("hata-konumu1").value);
            const konum2 = parseInt(document.getElementById("hata-konumu2").value);
            if (isNaN(konum1) || konum1 < 1 || konum1 > uzunluk ||
                isNaN(konum2) || konum2 < 1 || konum2 > uzunluk ||
                konum1 === konum2) {
                alert(`Geçerli ve farklı konumlar girin (1 - ${uzunluk})`);
                return;
            }
            hataliIndexler.push(konum1 - 1, konum2 - 1);
        }

        const veriArray = window.guncelVeri.split("");
        hataliIndexler.forEach(idx => {
            veriArray[idx] = veriArray[idx] === "0" ? "1" : "0";
        });

        window.hatalıVeri = veriArray.join("");
        // Sağdan sola gösterim için reverse
        document.getElementById("hatali-veri").textContent = window.hatalıVeri.split('').reverse().join('');
        gosterHamming(window.hatalıVeri, hataliIndexler);
    };

    window.hataTespitEt = function() {
        if (!window.hatalıVeri) {
            alert("Önce hatalı veri oluşturmalısınız.");
            return;
        }

        const tersVeri = window.hatalıVeri.split("");
        const uzunluk = tersVeri.length;
        const paritySayisi = Math.floor(Math.log2(uzunluk - 1));
        let sendrom = 0;

        // Sendrom hesapla
        for (let i = 0; i < paritySayisi; i++) {
            let konum = Math.pow(2, i);
            let sayac = 0;
            for (let j = 0; j < uzunluk - 1; j++) {
                if (((j + 1) & konum) !== 0) {
                    sayac += parseInt(tersVeri[j]);
                }
            }
            if (sayac % 2 !== 0) {
                sendrom += konum;
            }
        }

        // Genel parite kontrolü
        const beklenenParity = parseInt(tersVeri[uzunluk - 1]);
        let genelParity = 0;
        for (let i = 0; i < uzunluk - 1; i++) {
            genelParity ^= parseInt(tersVeri[i]);
        }
        const parityHatasi = genelParity !== beklenenParity;

        let sonucVeri = tersVeri.slice();
        let hataTuru = "";
        let sendromGoster = sendrom;

        if (sendrom === 0 && !parityHatasi) {
            hataTuru = "Hata yok.";
        } else if (sendrom !== 0 && parityHatasi) {
            if (sendrom === uzunluk || sendrom < 1 || sendrom > uzunluk - 1) {
                hataTuru = "Çift bit hatası tespit edildi. Bu hata düzeltilemez.";
                sendromGoster = "";
            } else {
                hataTuru = `Tek bit hatası tespit edildi (konum: ${sendrom}). Düzeltildi.`;
                sonucVeri[sendrom - 1] = sonucVeri[sendrom - 1] === "0" ? "1" : "0";
            }
        } else if (sendrom === 0 && parityHatasi || sendrom !== 0 && !parityHatasi) {
            hataTuru = "Çift bit hatası tespit edildi. Bu hata düzeltilemez.";
            sendromGoster = "";
        }

        document.getElementById("sendrom").textContent = sendromGoster;
        document.getElementById("hatali-bit").textContent = sendromGoster;
        // Sağdan sola gösterim için reverse
        document.getElementById("duzeltilmis-veri").textContent = 
            sonucVeri.join("").split('').reverse().join('') + ` (${hataTuru})`;

        gosterHamming(sonucVeri.join(""));
    };

    function hammingKodla(veri) {
        const veriBiti = veri.split("").reverse();
        let toplamBit = veri.length;
        let paritySayisi = 0;

        while ((1 << paritySayisi) < toplamBit + paritySayisi + 1) {
            paritySayisi++;
        }

        const hamming = new Array(toplamBit + paritySayisi + 1).fill(0);
        let veriIndex = 0;
        let toplamUzunluk = toplamBit + paritySayisi;

        for (let i = 1; i <= toplamUzunluk; i++) {
            if (Math.log2(i) % 1 === 0) {
                hamming[i-1] = 0;
            } else {
                hamming[i-1] = parseInt(veriBiti[veriIndex++]);
            }
        }

        for (let i = 0; i < paritySayisi; i++) {
            let konum = Math.pow(2, i) - 1;
            let sayac = 0;
            for (let j = 0; j < toplamUzunluk; j++) {
                if (j !== konum && ((j + 1) & (1 << i))) {
                    sayac += hamming[j];
                }
            }
            hamming[konum] = sayac % 2;
        }

        let genelParity = 0;
        for (let i = 0; i < toplamUzunluk; i++) {
            genelParity ^= hamming[i];
        }
        hamming[toplamUzunluk] = genelParity;

        return hamming.join("");
    }

    function gosterHamming(veri, hataliIndexler = []) {
        hammingGosterim.innerHTML = "";
        const dizi = veri.split("");
        const uzunluk = dizi.length;
        const boyutClass = uzunluk > 16 ? 'kompakt' : '';

        // Diziyi ters çevirmeye gerek yok, flex-direction: row-reverse kullanıyoruz
        dizi.forEach((bit, idx) => {
            const span = document.createElement("span");
            span.classList.add("bit");
            if (boyutClass) span.classList.add(boyutClass);
            span.textContent = bit;

            const gercekIndex = idx + 1;

            if (gercekIndex === uzunluk) {
                span.classList.add("genel-parity");
            } else if (Math.log2(gercekIndex) % 1 === 0) {
                span.classList.add("parity");
            } else {
                span.classList.add("veri");
            }

            if (hataliIndexler.includes(idx)) {
                span.classList.add("hatali");
            }

            const bitContainer = document.createElement("div");
            bitContainer.classList.add("bit-kutu");
            if (boyutClass) bitContainer.classList.add(boyutClass);

            const indexLabel = document.createElement("div");
            indexLabel.classList.add("indis");
            indexLabel.textContent = gercekIndex;

            bitContainer.appendChild(indexLabel);
            bitContainer.appendChild(span);
            hammingGosterim.appendChild(bitContainer);
        });
    }
});