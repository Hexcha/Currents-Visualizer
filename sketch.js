/*
  TAME IMPALA - CURRENTS  
  (DEEP PURPLE & BASS FLASH EDITION)
  MUSIC-REACTIVE VISUAL + CUBIC BEZIER FLOW
  
  Bu proje, müzik ritmine duyarlı (audio-reactive) bir görselleştirme sunar.
  Temel özellikler:
  1. Fizik tabanlı bir lazerin küreye çarpması.
  2. Çarpışma sonrası yayılan dalgaların (Wake) kübik Bézier eğrileri ile çizilmesi.
  3. Müzik çalar kontrolleri (Oynat/Durdur, Zaman Çubuğu).
*/

// --- GLOBAL DEĞİŞKENLER ---
let song;           // Ses dosyasını tutacak nesne
let fft;            // Sesi analiz edecek Fourier Transform nesnesi
let fileInput;      // Dosya yükleme butonu
let seekSlider;     // Şarkı içinde gezinmeyi sağlayan slider
let playPauseBtn;   // Oynat/Durdur butonu
let isSeeking = false; // Kullanıcının slider ile oynayıp oynamadığını kontrol eder

// --- GÖRSEL AYARLAR ---
let sphereR = 90;     // Ortadaki kürenin yarıçapı
let numStrands = 350; // Çarpışma sonrası oluşacak dalga (tel) sayısı

// --- DURUM YÖNETİMİ (STATE MACHINE) ---
let state = 0;      // 0: Lazer Yaklaşıyor, 1: Çarpışma Oldu (Akış Başladı)
let stateTimer = 0; // Durumun ne kadar sürdüğünü sayar
let wakeTimer = 0;  // Dalgaların animasyon zamanlayıcısı

// --- FİZİK VE KAMERA ---
let redHead;        // Lazerin baş kısmının (x,y) konumu
let redStartPos;    // Lazerin ilk doğduğu konum (Kuyruk çizimi için gerekli)
let impactAngle = 0;// Lazerin küreye çarpma açısı
let camX = 0, camY = 0, camZoom = 1.0; // Kamera (bakış açısı) koordinatları

// -----------------------------------------------------------
// SETUP: Program ilk açıldığında bir kez çalışır.
// Tuvali oluşturur, analizi başlatır ve arayüzü (UI) kurar.
// -----------------------------------------------------------
function setup() {
  // Tarayıcı penceresini kaplayan çizim alanı
  createCanvas(windowWidth, windowHeight);
  pixelDensity(2); // Yüksek çözünürlüklü ekranlar için netlik ayarı
  
  // FFT: Sesi frekanslara ayırır. 
  // 0.4: Yumuşatma değeri (düşük olması bas vuruşlarına ani tepki verir).
  fft = new p5.FFT(0.4, 1024);
  
  // --- DOSYA YÜKLEME BUTONU ---
  fileInput = createFileInput(handleFile);
  fileInput.position(width/2 - 100, height - 130); 
  fileInput.style('color', 'white');
  fileInput.style('font-family', 'sans-serif');

  // --- OYNAT / DURAKLAT BUTONU ---
  playPauseBtn = createButton('▶ OYNAT');
  playPauseBtn.position(width/2 - 60, height - 90); 
  playPauseBtn.size(120, 40);
  
  // Buton için CSS Stilleri (Neon/Magenta Teması)
  playPauseBtn.style("background-color", "#ff00b4"); 
  playPauseBtn.style("color", "white");
  playPauseBtn.style("border", "none");
  playPauseBtn.style("border-radius", "20px"); // Yuvarlak köşeler
  playPauseBtn.style("font-family", "sans-serif");
  playPauseBtn.style("font-weight", "bold");
  playPauseBtn.style("font-size", "14px");
  playPauseBtn.style("cursor", "pointer");
  playPauseBtn.style("box-shadow", "0 0 15px rgba(255, 0, 180, 0.6)"); // Neon parlaması
  playPauseBtn.style("transition", "all 0.3s ease"); // Animasyonlu geçiş

  // Buton üzerine gelince (Hover) efektleri
  playPauseBtn.mouseOver(() => {
    playPauseBtn.style("background-color", "#d9009a"); 
    playPauseBtn.style("transform", "scale(1.05)");
  });
  playPauseBtn.mouseOut(() => {
    playPauseBtn.style("background-color", "#ff00b4");
    playPauseBtn.style("transform", "scale(1)");
  });

  // Tıklama olayı
  playPauseBtn.mousePressed(togglePlay); 
  playPauseBtn.hide(); // Şarkı yüklenene kadar gizli kalsın

  // --- ZAMAN ÇUBUĞU (SEEK SLIDER) ---
  seekSlider = createSlider(0, 100, 0, 0.1);
  seekSlider.position(width/2 - 150, height - 40);
  seekSlider.style("width", "300px");
  
  // Slider Rengi (Wave renkleriyle uyumlu)
  seekSlider.style("accent-color", "#ff00b4"); 
  seekSlider.style("cursor", "pointer");
  seekSlider.hide();

  // Slider ile oynandığında şarkıyı o noktaya sarar
  seekSlider.input(() => {
    if (song && song.isLoaded()) {
      isSeeking = true;
      let pct = seekSlider.value() / 100;
      song.jump(pct * song.duration());
    }
  });

  // İlk animasyon döngüsünü başlat
  resetCycle();
}

// -----------------------------------------------------------
// togglePlay: Oynat/Durdur butonunun işlevini yönetir.
// Müziği durdurur/başlatır ve butonun görünümünü değiştirir.
// -----------------------------------------------------------
function togglePlay() {
  if (song && song.isLoaded()) {
    if (song.isPlaying()) {
      song.pause();
      playPauseBtn.html('▶ OYNAT'); 
      playPauseBtn.style("background-color", "#444"); // Pasif (Gri) renk
      playPauseBtn.style("box-shadow", "none");
    } else {
      song.loop(); // Döngüsel çalma
      playPauseBtn.html('⏸ DURDUR'); 
      playPauseBtn.style("background-color", "#ff00b4"); // Aktif (Magenta) renk
      playPauseBtn.style("box-shadow", "0 0 15px rgba(255, 0, 180, 0.6)");
    }
  }
}

// -----------------------------------------------------------
// handleFile: Kullanıcı dosya seçtiğinde çalışır.
// Ses dosyasını yükler ve UI elemanlarını görünür yapar.
// -----------------------------------------------------------
function handleFile(file) {
  if (file.type === 'audio') {
    if (song && song.isPlaying()) song.stop(); // Önceki şarkıyı durdur
    song = loadSound(file.data, () => { 
      song.play(); 
      fft.setInput(song); // Analizciye şarkıyı bağla

      // Arayüzü göster
      seekSlider.show();
      seekSlider.value(0);
      playPauseBtn.show();
      playPauseBtn.html('⏸ DURDUR');
    });
  }
}

// -----------------------------------------------------------
// DRAW: Ana çizim döngüsü. Saniyede 60 kez çalışır.
// Analiz, Mantık ve Çizim işlemlerini sırayla yapar.
// -----------------------------------------------------------
function draw() {
  // Arka Plan: Hafif saydam siyah çizerek hareket izi (trail) bırakır.
  noStroke();
  fill(0, 0, 5, 50);
  rect(0, 0, width, height);

  // --- 1. MÜZİK ANALİZİ ---
  let beat = 0;
  if (song && song.isPlaying()) {
    fft.analyze();
    let bass = fft.getEnergy("bass");     
    let lowMid = fft.getEnergy("lowMid"); 
    // Bas ve alt-mid frekansları birleştiriyoruz
    let energy = (bass * 0.8) + (lowMid * 0.2);
    
    // Beat Algılama: Sadece güçlü vuruşları (Kick) alıp haritalıyoruz.
    // pow(beat, 3) işlemi, düşük sesleri sönümleyip güçlü sesleri patlatır.
    beat = map(energy, 180, 255, 0, 1, true);
    beat = pow(beat, 3);
  }

  // --- 2. SLIDER & ZAMAN GÜNCELLEME ---
  if (song && song.isLoaded()) {
    // Slider'ı şarkı süresine göre ilerlet (Kullanıcı tutmuyorsa)
    if (song.isPlaying() && !isSeeking) {
      let pct = song.currentTime() / song.duration();
      seekSlider.value(pct * 100);
    }
    isSeeking = false;

    // Zaman Damgası Çizimi (Örn: 01:23 / 03:45)
    let currTime = formatTime(song.currentTime());
    let totalTime = formatTime(song.duration());
    
    push();
    resetMatrix(); // UI elemanlarını kamera zoom/pan etkisinden koru
    fill(200, 100, 255); // Açık Lila metin
    noStroke();
    textAlign(CENTER, TOP);
    textSize(12);
    textStyle(BOLD);
    text(currTime + " / " + totalTime, width/2, height - 20);
    pop();
  }

  // --- 3. DURUM MAKİNESİ (State Machine) ---
  // State 0: Lazer küreye yaklaşıyor
  // State 1: Çarpışma oldu, mor dalgalar akıyor
  if (state === 0) updateApproach();
  else updateFlow(beat);

  updateCamera(); // Kamera pozisyonunu güncelle

  // --- 4. SAHNE ÇİZİMİ ---
  push();
  translate(width/2, height/2); // Merkezi (0,0) noktasına al
  scale(camZoom);               // Kamerayı yaklaştır/uzaklaştır
  translate(-camX, -camY);      // Kamerayı hedefe odakla

  drawChromeSphere(0, 0, sphereR); // Ortadaki metalik küreyi çiz

  if (state === 0) drawRedLaser(beat);      // Lazer yaklaşırken çiz
  if (state === 1) drawDeepPurpleWake(beat);// Çarpışma sonrası dalgaları çiz
  
  pop();

  // Müzik yoksa uyarı metni göster
  if (!song || !song.isPlaying()) {
    fill(255); noStroke(); textAlign(CENTER); textSize(14);
    text("MÜZİK YÜKLEMEK İÇİN YUKARIYA BAKIN", width/2, height - 150);
  }
}

// -----------------------------------------------------------
// formatTime: Saniyeyi MM:SS formatına çevirir.
// -----------------------------------------------------------
function formatTime(seconds) {
  let m = floor(seconds / 60);
  let s = floor(seconds % 60);
  return nf(m, 2) + ":" + nf(s, 2);
}

// ===============================================================
//               MANTIK: LAZER YAKLAŞIMI (State 0)
// ===============================================================

function updateApproach() {
  // Lazerin hedefe (0,0) olan yönünü vektörel olarak bul
  let dir = p5.Vector.sub(createVector(0,0), redHead).normalize();
  redHead.add(p5.Vector.mult(dir, 20)); // Lazeri hareket ettir
  
  // Çarpışma kontrolü (Küre içine girdi mi?)
  if (redHead.mag() < sphereR - 5) {
    state = 1; stateTimer = 0; wakeTimer = 0;
    impactAngle = redHead.heading(); // Çarpma açısını kaydet
  }
  
  // Kamera Takibi: Lazere doğru yumuşakça (lerp) yaklaş
  camX = lerp(camX, redHead.x, 0.1);
  camY = lerp(camY, redHead.y, 0.1);
  camZoom = lerp(camZoom, 1.8, 0.05);
}

// ===============================================================
//               MANTIK: ÇARPIŞMA SONRASI AKIŞ (State 1)
// ===============================================================

function updateFlow(beat) {
  stateTimer++;
  // Beat ne kadar güçlüyse zaman o kadar hızlı akar (Animasyon hızlanır)
  wakeTimer += 0.01 + (beat * 0.05);
  
  // Kameranın gideceği yeni hedef (Çarpışmanın tam tersi yönü)
  let exitAngle = impactAngle + PI; 
  let targetX = cos(exitAngle) * 200;
  let targetY = sin(exitAngle) * 200;
  
  // Kamerayı uzaklaştır ve akış yönüne kaydır
  camX = lerp(camX, targetX, 0.05);
  camY = lerp(camY, targetY, 0.05);
  camZoom = lerp(camZoom, 0.65, 0.02); 
  
  // Belirli bir süre sonra döngüyü sıfırla
  if (stateTimer > 500) {
    resetCycle();
  }
}

// Güvenlik: Kamera değerleri bozulursa (NaN) sıfırla
function updateCamera() {
  if (isNaN(camX)) camX = 0;
  if (isNaN(camY)) camY = 0;
  if (isNaN(camZoom)) camZoom = 1.0;
}

// Döngüyü başa sarar ve yeni bir rastgele lazer oluşturur
function resetCycle() {
  state = 0;
  let angle = random(TWO_PI); 
  let dist = 1400;
  redHead = p5.Vector.fromAngle(angle).mult(dist);
  redStartPos = redHead.copy();
  camX = redHead.x; 
  camY = redHead.y; 
  camZoom = 2.0;
}

// ===============================================================
//               MANUEL KÜBİK BÉZIER HESAPLAMASI
// Bu fonksiyonlar, p5.js'in hazır bezier() fonksiyonu yerine
// matematiksel formülü elle uygular.
// ===============================================================

// Kübik Bézier Formülü: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
// Verilen 4 nokta (p0, p1, p2, p3) ve t parametresine (0-1) göre
// eğri üzerindeki tam (x,y) noktasını hesaplar.
function cubicBezierPoint(p0, p1, p2, p3, t) {
  let u = 1 - t;

  let x = 
    u*u*u * p0.x +
    3 * u*u * t * p1.x +
    3 * u * t*t * p2.x +
    t*t*t * p3.x;

  let y =
    u*u*u * p0.y +
    3 * u*u * t * p1.y +
    3 * u * t*t * p2.y +
    t*t*t * p3.y;

  return createVector(x, y);
}

// Eğriyi t parametresine göre adım adım örnekleyerek çizer.
// steps: Eğrinin kaç parçadan oluşacağını belirler (Çözünürlük).
function drawCubicBezier(p0, p1, p2, p3, steps = 60) {
  beginShape();
  for (let i = 0; i <= steps; i++) {
    let t = i / steps; // 0'dan 1'e kadar ilerle
    let pt = cubicBezierPoint(p0, p1, p2, p3, t); // Noktayı hesapla
    vertex(pt.x, pt.y); // Noktayı şekle ekle
  }
  endShape();
}

// ===============================================================
//                           ÇİZİM FONKSİYONLARI
// ===============================================================

// Metalik görünümlü küreyi çizer (Radyal Gradyan kullanarak)
function drawChromeSphere(x, y, r) {
  push();
  let ctx = drawingContext;
  // Gradyan oluşturma (Işık parlamasından gölgeye)
  let grad = ctx.createRadialGradient(x - r/3, y - r/3, r/10, x, y, r);
  grad.addColorStop(0.0, '#FFFFFF');
  grad.addColorStop(0.2, '#D0D0D5');
  grad.addColorStop(0.5, '#505055');
  grad.addColorStop(0.9, '#101015');
  grad.addColorStop(1.0, '#000000');
  ctx.fillStyle = grad;
  noStroke();
  // Küre etrafına hafif mor gölge (Glow)
  ctx.shadowBlur = 40;
  ctx.shadowColor = "rgba(100, 0, 200, 0.2)";
  circle(x, y, r * 2);
  pop();
}

// Kırmızı lazer ışınını çizer
function drawRedLaser(beat) {
  let dir = p5.Vector.sub(redStartPos, redHead).normalize();
  let tailEnd = p5.Vector.add(redHead, p5.Vector.mult(dir, 1200)); // Kuyruk uzunluğu

  let ctx = drawingContext;
  // Linear Gradyan: Kuyruk şeffaf, baş kısmı opak kırmızı
  let grad = ctx.createLinearGradient(tailEnd.x, tailEnd.y, redHead.x, redHead.y);
  grad.addColorStop(0, 'rgba(100, 0, 0, 0)');
  grad.addColorStop(0.6, 'rgba(255, 0, 0, 1)');
  grad.addColorStop(1, 'rgba(255, 200, 200, 1)');
  
  ctx.strokeStyle = grad;
  strokeWeight(5 + (beat * 5)); // Beat ile kalınlaşır
  line(tailEnd.x, tailEnd.y, redHead.x, redHead.y);
  
  // Lazerin etrafındaki parlama (Glow)
  ctx.shadowBlur = 30 + (beat * 20);
  ctx.shadowColor = "rgba(255, 0, 0, 0.9)";
  stroke(255);
  strokeWeight(2);
  line(tailEnd.x, tailEnd.y, redHead.x, redHead.y); // İçindeki beyaz çekirdek
  ctx.shadowBlur = 0;
}

// Çarpışma sonrası oluşan mor dalgaları çizer
function drawDeepPurpleWake(beat) {
  blendMode(ADD); // Renkleri toplayarak karıştır (Işık efekti için)
  noFill();
  
  let flowAngle = impactAngle + PI;

  // Belirlenen sayıda (numStrands) tel çiz
  for (let i = 0; i < numStrands; i++) {
    let t = i / numStrands;

    // --- KONTROL NOKTALARININ HESAPLANMASI ---
    
    // P0: Başlangıç Noktası (Küre yüzeyinden çıkış)
    let spread = map(t, 0, 1, -PI/2.5, PI/2.5);
    let startAngle = flowAngle + spread;
    let sx = cos(startAngle) * (sphereR + 5);
    let sy = sin(startAngle) * (sphereR + 5);

    // Renk Ayarı: Kenarlar İndigo, orta Mor
    let c1 = color(30, 0, 80);
    let c2 = color(120, 20, 160);
    let distFromCenter = abs(t - 0.5) * 2;
    let col = lerpColor(c2, c1, distFromCenter);
    
    // Beat vurduğunda rengi parlak Magentaya çek (Flash Efekti)
    if (beat > 0.1) {
      let flashColor = color(255, 0, 180);
      col = lerpColor(col, flashColor, beat * 0.7);
    }

    col.setAlpha(45 + (beat * 90)); // Opaklık ayarı
    stroke(col);
    strokeWeight(map(distFromCenter, 0, 1, 2.0, 0.5));

    // P3: Bitiş Noktası (Uzaklarda dağılma)
    let dist = 2000;
    let endSpreadMult = 1000 + (beat * 800);
    let bx = cos(flowAngle) * dist;
    let by = sin(flowAngle) * dist;
    let px = -sin(flowAngle);
    let py = cos(flowAngle);
    let spreadW = map(t, 0, 1, -1, 1) * endSpreadMult;
    let ex = sx + bx + (px * spreadW);
    let ey = sy + by + (py * spreadW);

    // Gürültü (Noise): Çizgilere organik dalgalanma verir
    let nVal = noise(i * 0.05, wakeTimer) - 0.5;
    let turb = nVal * (300 + (beat * 500));
    
    // P1 ve P2: Kontrol Noktaları (Eğriliği belirler)
    let cp1x = sx + cos(flowAngle) * 600 + turb;
    let cp1y = sy + sin(flowAngle) * 600 + turb;
    let cp2x = ex - cos(flowAngle) * 800 + turb;
    let cp2y = ey - sin(flowAngle) * 800 + turb;

    // Vektörleri oluştur
    let p0 = createVector(sx, sy);
    let p1 = createVector(cp1x, cp1y);
    let p2 = createVector(cp2x, cp2y);
    let p3 = createVector(ex, ey);

    // Kendi yazdığımız Manuel Bézier Çizim fonksiyonunu çağır
    drawCubicBezier(p0, p1, p2, p3, 60);
  }
  
  blendMode(BLEND); // Karışım modunu normale döndür
}

// Pencere boyutu değişirse tuvali ve butonları yeniden hizala
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  fileInput.position(width/2 - 100, height - 130);
  playPauseBtn.position(width/2 - 60, height - 90);
  seekSlider.position(width/2 - 150, height - 40);
}