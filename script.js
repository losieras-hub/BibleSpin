
const API_KEY = "HMr0caiAPXobQDhx7SRkZ";
const BIBLE_ID = "de4e12af7f28f599-01";
const API_URL = "https://rest.api.bible/v1";

const wheel = document.getElementById("wheel");
const ctx = wheel.getContext("2d");
const spinButton = document.getElementById("spin-button");
const bookName = document.getElementById("book-name");
const verseReference = document.getElementById("verse-reference");
const verseText = document.getElementById("verse-text");

let books = [];
let rotation = 0;

async function fetchData(url) {
    const response = await fetch(url, {
        headers: {
            "api-key": API_KEY
        }
    });

    if (!response.ok) {
        throw new Error("Unable to retrieve Bible data.");
    }

    return response.json();
}

async function loadBooks() {
    try {
        bookName.textContent = "Loading Bible books...";

        const result = await fetchData(
            `${API_URL}/bibles/${BIBLE_ID}/books?include-chapters=true`
        );

        books = result.data.filter(book => book.chapters && book.chapters.length > 0);

        drawWheel();

        bookName.textContent = "Ready to spin!";
    } catch (error) {
        bookName.textContent = "Unable to load Bible books.";
        verseText.textContent = error.message;
    }
}

function drawWheel() {
    const center = wheel.width / 2;
    const radius = center - 5;
    const slice = (2 * Math.PI) / books.length;

    ctx.clearRect(0, 0, wheel.width, wheel.height);

    books.forEach((book, index) => {
        const startAngle = -Math.PI / 2 + rotation + index * slice;
        const endAngle = startAngle + slice;

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = index % 2 === 0 ? "#285A91" : "#247A45";
        ctx.fill();

        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(startAngle + slice / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 9px Arial";
        ctx.fillText(book.abbreviation, radius - 8, 3);
        ctx.restore();
    });
}

function spinWheel() {
    if (books.length === 0) {
        return;
    }

    spinButton.disabled = true;

    const selectedIndex = Math.floor(Math.random() * books.length);
    const selectedBook = books[selectedIndex];

    const slice = (2 * Math.PI) / books.length;
    const currentPosition = ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const targetPosition = (2 * Math.PI - (selectedIndex + 0.5) * slice) % (2 * Math.PI);
    const difference = (targetPosition - currentPosition + 2 * Math.PI) % (2 * Math.PI);

    const startRotation = rotation;
    const targetRotation = rotation + difference + (6 + Math.floor(Math.random() * 3)) * 2 * Math.PI;

    const startTime = performance.now();
    const duration = 5000;

    function animate(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easing = 1 - Math.pow(1 - progress, 4);

        rotation = startRotation + (targetRotation - startRotation) * easing;

        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            rotation = targetRotation;
            bookName.textContent = selectedBook.name;
            getRandomVerse(selectedBook);
        }
    }

    requestAnimationFrame(animate);
}

async function getRandomVerse(book) {
    verseReference.textContent = "";
    verseText.textContent = "Finding your verse...";

    try {
        const chapters = book.chapters;
        const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];

        const verseResult = await fetchData(
            `${API_URL}/bibles/${BIBLE_ID}/chapters/${randomChapter.id}/verses`
        );

        const verses = verseResult.data;
        const randomVerse = verses[Math.floor(Math.random() * verses.length)];

        const result = await fetchData(
            `${API_URL}/bibles/${BIBLE_ID}/verses/${randomVerse.id}?content-type=text`
        );

        verseReference.textContent = result.data.reference;
        verseText.textContent = result.data.content.trim();

    } catch (error) {
        verseText.textContent = "Unable to retrieve your verse. Please try again.";
    }

    spinButton.disabled = false;
}

spinButton.addEventListener("click", spinWheel);

loadBooks();

