window.addEventListener("load", init);

let pieces = ["r", "kn", "b", "q", "k", "b", "kn", "r", "p"];
let imgPieces = {};
let boardColors = ["#eceed4", "#749654"];
let selectedColor = "#dc0000";
let sjadamMoveColor = "#0068dc";
let chessboard;
let canvas, blockSize, ctx;
let turnSpan;
let isWhitePlaying = true;
let isWhiteTurn = true;
let hoverPos = {x: -1, y: -1};
let clickedPos = {x: -1, y: -1};
let chessMoves = [], sjadamMoves = [];
let sjadamPiece = {x: -1, y: -1, dX: -1, dY: -1, opponentJumps: 0, piece: ""};

function init() {

    // Load elements.
    turnSpan = document.querySelector("#turn");
    canvas = document.querySelector("#game");
    canvas.addEventListener("mousemove", canvasMouseMove);
    canvas.addEventListener("mouseup", canvasMouseUp);
    canvas.addEventListener("mouseleave", canvasMouseLeave);
    ctx = canvas.getContext("2d");
    blockSize = canvas.width / 8;

	// Load images
	loadImage(0, "w", function() {
		initChessBoard();
		draw();
	});
}

function loadImage(pieceIndex, color, cb) {
	let piece = pieces[pieceIndex % pieces.length] + color;
	let img = new Image();
	img.onload = function() {
		pieceIndex++;
		if (pieceIndex == 19) cb();
		imgPieces[piece] = img;
		loadImage(pieceIndex, pieceIndex <= 8 ? "w" : "b", cb)
	};
	img.src = "img/" + piece + ".png";
}

function canvasMouseMove(e) {
    let newX = ~~(e.offsetX / blockSize);
    let newY = ~~(e.offsetY / blockSize);
    if (newX != hoverPos.x || newY != hoverPos.y) {
        hoverPos.x = newX;
        hoverPos.y = newY;
        draw();
    }
}

function checkPos(a) {
    return a.x == hoverPos.x && a.y == hoverPos.y;
}

function switchTurn() {
    isWhiteTurn = !isWhiteTurn;
    turnSpan.innerHTML = isWhiteTurn ? "White" : "Black";
    chessMoves = [];
    sjadamMoves = [];
    clickedPos = {x: -1, y: -1};
    sjadamPiece = {x: -1, y: -1, dX: -1, dY: -1, opponentJumps: 0, piece: ""};
    draw();
}

function canvasMouseUp(e) {
	if ((hoverPos.x != -1 || hoverPos.y != -1) && (clickedPos.x != hoverPos.x || clickedPos.y != hoverPos.y)) {

        // Check if we can select the piece (right color).
        let piece = chessboard[hoverPos.y][hoverPos.x];
        let color = piece.slice(-1);
        if ((isWhiteTurn && color != "" && color != "w") || (!isWhiteTurn && color != "" && color != "b")) return;

        // Check if we are clicking on a move, and move if possible.
        let canDoChessMove = chessMoves.filter(checkPos).length;
        let canDoSjadamMove = sjadamMoves.filter(checkPos).length;
        let canChangePiece = (sjadamPiece.x == -1 && sjadamPiece.y == -1) || (sjadamPiece.x == sjadamPiece.dX && sjadamPiece.y == sjadamPiece.dY);
        let moved = false;
        if (canDoChessMove || canDoSjadamMove)  {
            movePiece(clickedPos.x, clickedPos.y, hoverPos.x, hoverPos.y);
            moved = true;
            if (e.button == 0) {
                switchTurn();
                return;
            }
        } else {

            // Check if we can select a piece. We cannot change the piece if we have moved the current one.
            if (canChangePiece) {
                sjadamPiece.x = hoverPos.x;
                sjadamPiece.y = hoverPos.y;
                sjadamPiece.piece = piece;
            } else {
                if (piece != sjadamPiece.piece) return;
            }
        }
        clickedPos.x = hoverPos.x;
        clickedPos.y = hoverPos.y;
        sjadamPiece.dX = clickedPos.x;
        sjadamPiece.dY = clickedPos.y;
        chessMoves = findChessMoves(sjadamPiece.dX, sjadamPiece.dY);
        sjadamMoves = findSjadamMoves(sjadamPiece.dX, sjadamPiece.dY);
        draw();
	}
}

function canvasMouseLeave() {
    hoverPos.x = -1;
    hoverPos.y = -1;
    draw();
}

function printBoard() {
    for (let y = 0; y < 8; y++) {
        console.log("-".repeat(32));
        let str = "";
        for (let x = 0; x < 8; x++) {
            str += (chessboard[y][x] == "" ? "   " : ("   " + chessboard[y][x]).slice(-3)) + "|";
        }
        console.log(str);
    }
}

function initChessBoard() {
    chessboard = [];
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            if (chessboard[y] === undefined) chessboard[y] = [];
            let piece;
            switch (y) {
                case 0:
                    piece = pieces[x] + (isWhitePlaying ? "b" : "w");
                    break;
                case 1:
                    piece = pieces[pieces.length - 1] + (isWhitePlaying ? "b" : "w");
                    break;
                case 6:
                    piece = pieces[pieces.length - 1] + (isWhitePlaying ? "w" : "b");
                    break;
                case 7:
                    piece = pieces[x] + (isWhitePlaying ? "w" : "b");
                    break;
                default:
                    piece = "";
                    break;
            }
            chessboard[y].push(piece);
        }
    }
}

function drawBoardBackground() {
    ctx.save();
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            ctx.beginPath();
            ctx.rect(blockSize * i, blockSize * j, blockSize, blockSize);
            ctx.fillStyle = boardColors[j % 2 == 0 ? i % 2 : (i + 1) % 2];
            ctx.fill();
            ctx.closePath();
        }
    }
    ctx.restore();
}

function draw() {
    drawBoardBackground();
	if (chessboard == undefined) return;
    ctx.save();
    ctx.font = blockSize + "px Chess";
    ctx.fillStyle = "#000";
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            let pieceToDraw = chessboard[y][x];

            // Hover/Clicked rectangle drawings
            if (hoverPos.x != -1 && hoverPos.y != -1 && (hoverPos.x != clickedPos.x || hoverPos.y != clickedPos.y)) {
                ctx.save();
                ctx.globalAlpha = 0.02;
                ctx.fillRect(hoverPos.x * blockSize, hoverPos.y * blockSize, blockSize, blockSize);
                ctx.restore();
            }
            if (clickedPos.x == x && clickedPos.y == y) {
                ctx.save();
                ctx.fillStyle = selectedColor;
                ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                ctx.restore();
            }
            if (sjadamMoves.length > 0) {
                for (let i = 0; i < sjadamMoves.length; i++) {
                    let move = sjadamMoves[i];
                    ctx.save();
                    ctx.globalAlpha = 0.02;
                    ctx.fillStyle = sjadamMoveColor;
                    ctx.fillRect(move.x * blockSize, move.y * blockSize, blockSize, blockSize);
                    ctx.restore();
                }
            }

            // Check if we can draw piece
            if (pieceToDraw != "") {
				ctx.drawImage(imgPieces[pieceToDraw], x * blockSize, y * blockSize); // Draw image
			}
        }
    }
    ctx.restore();
}

function getPiece(x, y) {
    let piece = chessboard[y][x].slice(0, -1);
    if (piece != "") return piece;
    if (sjadamPiece.piece != "" && sjadamPiece.x == x && sjadamPiece.y == y) return sjadamPiece.piece;
    return "";
}

function movePiece(x, y, dX, dY) {
    if (!isValidPos(x, y) || !isValidPos(dX, dY)) return;
    chessboard[dY][dX] = chessboard[y][x];
    chessboard[y][x] = "";
    draw();
}

function isValidPos(x, y) {
    return x >= 0 && x < 8 && y >= 0 && y < 8;
}

function findChessMoves(x, y) {
	let piece = getPiece(x, y);
	if (piece == "") return [];

	// TODO.
    let moves = [];
    return moves;
}

function findSjadamMoves(x, y) {
	let piece = getPiece(x, y);
	if (piece == "") return [];

    console.log("Finding sjadam move for: ", piece);

    // Check neighbours and search for valid sjadam jumps.
    let moves = [];
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            let nPos = {x: x + i, y: y + j};
            if ((i != 0 || j != 0) && isValidPos(nPos.x, nPos.y) && chessboard[nPos.y][nPos.x] != "") {
                let moveTo = {x: nPos.x + i, y: nPos.y + j};
                if (!isValidPos(moveTo.x, moveTo.y)) continue;
                if (chessboard[moveTo.y][moveTo.x] == "") moves.push(moveTo);
            }
        }
    }
	return moves;
}
