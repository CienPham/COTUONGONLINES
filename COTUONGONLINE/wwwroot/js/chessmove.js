// Kết nối đến SignalR
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/roomHub")
    .build();

connection.start().then(() => {
    console.log("Connected to SignalR hub");
}).catch(err => console.error(err.toString()));
const pieceValues = {
    'chutuong': 10000,  // Tướng
    'si': 200,         // Sĩ
    'tuong': 200,      // Tượng
    'ma': 400,         // Mã
    'xe': 900,         // Xe
    'phao': 450,       // Pháo
    'tot': 100         // Tốt
};
const positionEvalCache = new Map();
const threatCache = new Map();
const evaluationCache = new Map();

var matrix = [];
var app = new Vue({
    el: '#app',
    data: {
        chessNode: [],
        top: 0,
        left: 0,
        currentTurn: 'do',
        gameOver: false,
        winner: null,
        isRedKingAlive: true,
        isBlackKingAlive: true,
        playWithAI: false, // Xác định chơi với AI hay người

        aiColor: 'do' // Màu mặc định của AI là đỏ
    },
    methods: {
        // Thêm hàm isPathClear
        isPathClear(nodeStart, nodeEnd, matrix) {
            // Kiểm tra đường đi ngang
            if (nodeStart.i === nodeEnd.i) {
                const minJ = Math.min(nodeStart.j, nodeEnd.j);
                const maxJ = Math.max(nodeStart.j, nodeEnd.j);
                for (let j = minJ + 1; j < maxJ; j++) {
                    if (matrix[nodeStart.i][j].id !== "") {
                        return false;
                    }
                }
            }
            // Kiểm tra đường đi dọc
            else if (nodeStart.j === nodeEnd.j) {
                const minI = Math.min(nodeStart.i, nodeEnd.i);
                const maxI = Math.max(nodeStart.i, nodeEnd.i);
                for (let i = minI + 1; i < maxI; i++) {
                    if (matrix[i][nodeStart.j].id !== "") {
                        return false;
                    }
                }
            }
            return true;
        },

        // Thêm hàm countPiecesBetween cho quân pháo
        countPiecesBetween(nodeStart, nodeEnd, matrix) {
            let count = 0;
            // Kiểm tra đường đi ngang
            if (nodeStart.i === nodeEnd.i) {
                const minJ = Math.min(nodeStart.j, nodeEnd.j);
                const maxJ = Math.max(nodeStart.j, nodeEnd.j);
                for (let j = minJ + 1; j < maxJ; j++) {
                    if (matrix[nodeStart.i][j].id !== "") {
                        count++;
                    }
                }
            }
            // Kiểm tra đường đi dọc
            else if (nodeStart.j === nodeEnd.j) {
                const minI = Math.min(nodeStart.i, nodeEnd.i);
                const maxI = Math.max(nodeStart.i, nodeEnd.i);
                for (let i = minI + 1; i < maxI; i++) {
                    if (matrix[i][nodeStart.j].id !== "") {
                        count++;
                    }
                }
            }
            return count;
        },

        getChessNode() {
            axios({
                url: '/api/chess/loadChessBoard',
                method: 'GET',
                responseType: 'json',

            }).then((response) => {
                this.chessNode = response.data.chessNode;
                matrix = response.data.maxtrix;

            });
        },
        getIndexByTopLef(top, left, matrix) {
            var obj = {};
            for (var i = 0; i < matrix.length; i++) {
                for (var j = 0; j < matrix[i].length; j++) {
                    if (Math.abs(matrix[i][j].top - top) < 20 && Math.abs(matrix[i][j].left - left) < 20) {
                        obj.i = i;
                        obj.j = j;
                        obj.id = matrix[i][j].id;
                        return obj;
                    }
                }
            }
            return null;
        },
        checkVictory() {
            // Kiểm tra xem các vua còn sống không
            let redKing = document.getElementById('chutuongdo');
            let blackKing = document.getElementById('chutuongden');

            this.isRedKingAlive = redKing && redKing.style.display !== "none";
            this.isBlackKingAlive = blackKing && blackKing.style.display !== "none";

            if (!this.isRedKingAlive) {
                this.gameOver = true;
                this.winner = 'den';
                return true;
            }
            if (!this.isBlackKingAlive) {
                this.gameOver = true;
                this.winner = 'do';
                return true;
            }

            return false;
        },
        checkKingsFaceToFace() {
            // Lấy vị trí của hai tướng
            let redKing = this.getIndexByTopLef(document.getElementById('chutuongdo').offsetTop, document.getElementById('chutuongdo').offsetLeft, matrix);
            let blackKing = this.getIndexByTopLef(document.getElementById('chutuongden').offsetTop, document.getElementById('chutuongden').offsetLeft, matrix);

            // Kiểm tra nếu hai tướng cùng cột
            if (redKing && blackKing && redKing.j === blackKing.j) {
                // Kiểm tra không có quân nào chắn giữa hai tướng
                const minI = Math.min(redKing.i, blackKing.i);
                const maxI = Math.max(redKing.i, blackKing.i);
                for (let i = minI + 1; i < maxI; i++) {
                    if (matrix[i][redKing.j].id !== "") {
                        return false; // Có quân chắn giữa, không đối mặt
                    }
                }

                // Nếu hai tướng đối mặt, xác định bên thắng
                this.gameOver = true;
                this.winner = this.currentTurn === 'do' ? 'den' : 'do';
                console.log(`Chiến thắng: ${this.winner}`);
                return true;
            }
            return false;
        },

        // Thêm method kiểm tra lượt đi
        checkTurn(pieceId) {
            let isRedPiece = pieceId.indexOf('do') >= 0;
            let isBlackPiece = pieceId.indexOf('den') >= 0;

            if ((this.currentTurn === 'do' && !isRedPiece) ||
                (this.currentTurn === 'den' && !isBlackPiece)) {
                console.log('Lỗi: Chưa đến lượt của bạn');
                return false;
            }
            return true;
        },

        dragStart(event) {
            if (this.gameOver) {
                console.log('Trò chơi đã kết thúc!');
                return;
            }

            const pieceId = event.currentTarget.id;
            if (!this.checkTurn(pieceId)) {
                event.preventDefault();
                return;
            }

            this.top = event.clientY;
            this.left = event.clientX;
        },
        dragEnd(event) {

            var id = event.currentTarget.id;
            var moveX = event.clientX - this.left;
            var moveY = event.clientY - this.top;
            moveX = moveX + event.currentTarget.offsetLeft;
            moveY = moveY + event.currentTarget.offsetTop;

            var nodeStart = this.getIndexByTopLef(event.currentTarget.offsetTop, event.currentTarget.offsetLeft, matrix);
            var nodeEnd = this.getIndexByTopLef(moveY, moveX, matrix);

            console.log('Di chuyển quân cờ:', id);
            console.log('Từ vị trí:', nodeStart);
            console.log('Đến vị trí:', nodeEnd);

            if (nodeEnd == null) {
                console.log('Lỗi: vị trí đích không hợp lệ');
                return;
            }

            var objRemove = null;
            // Xử lý quân mã
            if (id.indexOf('ma') >= 0) {
                console.log('===== Kiểm tra nước đi quân MÃ =====');
                var gapI = Math.abs(nodeEnd.i - nodeStart.i);
                var gapJ = Math.abs(nodeEnd.j - nodeStart.j);

                if (!((gapI == 1 && gapJ == 2) || (gapJ == 1 && gapI == 2))) {
                    console.log('Lỗi: Mã chỉ được đi nước đi hình chữ L (1-2)');
                    return;
                }
                //kiểm tra chặn mã
                if ((gapI == 1 && gapJ == 2) && (nodeEnd.j > nodeStart.j)) {
                    if (matrix[nodeStart.i][nodeStart.j + 1].id != "") {
                        console.log('Lỗi: Mã bị chặn khi đi ngang phải');
                        return;
                    }
                }
                if ((gapI == 1 && gapJ == 2) && (nodeEnd.j < nodeStart.j)) {
                    if (matrix[nodeStart.i][nodeStart.j - 1].id != "") {
                        console.log('Lỗi: Mã bị chặn khi đi ngang trái');
                        return;
                    }
                }
                if ((gapI == 2 && gapJ == 1) && (nodeEnd.i > nodeStart.i)) {
                    if (matrix[nodeStart.i + 1][nodeStart.j].id != "") {
                        console.log('Lỗi: Mã bị chặn khi đi xuống');
                        return;
                    }
                }
                if ((gapI == 2 && gapJ == 1) && (nodeEnd.i < nodeStart.i)) {
                    if (matrix[nodeStart.i - 1][nodeStart.j].id != "") {
                        console.log('Lỗi: Mã bị chặn khi đi lên');
                        return;
                    }
                }
                console.log('Nước đi hợp lệ cho quân Mã');
            }
            // Xử lý quân xe
            else if (id.indexOf('xe') >= 0) {
                console.log('===== Kiểm tra nước đi quân XE =====');
                if (!(nodeStart.i === nodeEnd.i || nodeStart.j === nodeEnd.j)) {
                    console.log('Lỗi: Xe chỉ được đi ngang hoặc dọc');
                    return;
                }
                if (!this.isPathClear(nodeStart, nodeEnd, matrix)) {
                    console.log('Lỗi: Đường đi của Xe bị cản bởi quân khác');
                    return;
                }
                console.log('Nước đi hợp lệ cho quân Xe');
            }
            // Xử lý quân pháo
            else if (id.indexOf('phao') >= 0) {
                console.log('===== Kiểm tra nước đi quân PHÁO =====');
                if (!(nodeStart.i === nodeEnd.i || nodeStart.j === nodeEnd.j)) {
                    console.log('Lỗi: Pháo chỉ được đi ngang hoặc dọc');
                    return;
                }
                var piecesBetween = this.countPiecesBetween(nodeStart, nodeEnd, matrix);
                if (nodeEnd.id !== "") { // Nếu điểm đến có quân (ăn quân)
                    if (piecesBetween !== 1) {
                        console.log('Lỗi: Pháo cần đúng 1 quân để ăn quân (hiện có ' + piecesBetween + ' quân)');
                        return;
                    }
                }
                console.log('Nước đi hợp lệ cho quân Pháo');
            }
            // Xử lý quân sĩ
            else if (id.indexOf('si') >= 0) {
                console.log('===== Kiểm tra nước đi quân SĨ =====');
                // Kiểm tra di chuyển chéo 1 ô
                if (!(Math.abs(nodeEnd.i - nodeStart.i) === 1 && Math.abs(nodeEnd.j - nodeStart.j) === 1)) {
                    console.log('Lỗi: Sĩ chỉ được đi chéo 1 ô');
                    return;
                }
                // Kiểm tra phạm vi cung
                if (id.indexOf('do') >= 0) { // Sĩ đỏ
                    if (!(nodeEnd.i >= 0 && nodeEnd.i <= 2 && nodeEnd.j >= 3 && nodeEnd.j <= 5)) {
                        console.log('Lỗi: Sĩ phải đi trong phạm vi cung');
                        return;
                    }
                } else { // Sĩ đen
                    if (!(nodeEnd.i >= 7 && nodeEnd.i <= 9 && nodeEnd.j >= 3 && nodeEnd.j <= 5)) {
                        console.log('Lỗi: Sĩ phải đi trong phạm vi cung');
                        return;
                    }
                }
                console.log('Nước đi hợp lệ cho quân Sĩ');
            }
            // Xử lý quân tượng
            else if (id.indexOf('tuong') >= 0 && id.indexOf('chutuong') < 0) {
                console.log('===== Kiểm tra nước đi quân TƯỢNG =====');
                // Kiểm tra di chuyển chéo 2 ô
                if (!(Math.abs(nodeEnd.i - nodeStart.i) === 2 && Math.abs(nodeEnd.j - nodeStart.j) === 2)) {
                    console.log('Lỗi: Tượng phải đi chéo 2 ô');
                    return;
                }
                // Kiểm tra chặn tượng
                var midPoint = matrix[(nodeStart.i + nodeEnd.i) / 2][(nodeStart.j + nodeEnd.j) / 2];
                if (midPoint.id !== "") {
                    console.log('Lỗi: Tượng bị chặn ở điểm giữa');
                    return;
                }
                // Kiểm tra qua sông
                if (id.indexOf('do') >= 0) { // Tượng đỏ
                    if (nodeEnd.i > 4) {
                        console.log('Lỗi: Tượng không được qua sông');
                        return;
                    }
                } else { // Tượng đen
                    if (nodeEnd.i < 5) {
                        console.log('Lỗi: Tượng không được qua sông');
                        return;
                    }
                }
                console.log('Nước đi hợp lệ cho quân Tượng');
            }
            // Xử lý quân tướng
            else if (id.indexOf('chutuong') >= 0) {
                console.log('===== Kiểm tra nước đi quân TƯỚNG =====');
                // Kiểm tra di chuyển 1 ô theo chiều dọc hoặc ngang
                if (!((Math.abs(nodeEnd.i - nodeStart.i) === 1 && nodeEnd.j === nodeStart.j) ||
                    (Math.abs(nodeEnd.j - nodeStart.j) === 1 && nodeEnd.i === nodeStart.i))) {
                    console.log('Lỗi: Tướng chỉ được đi 1 ô theo chiều dọc hoặc ngang');
                    return;
                }
                // Kiểm tra phạm vi cung
                if (id.indexOf('do') >= 0) { // Tướng đỏ
                    if (!(nodeEnd.i >= 0 && nodeEnd.i <= 2 && nodeEnd.j >= 3 && nodeEnd.j <= 5)) {
                        console.log('Lỗi: Tướng phải đi trong phạm vi cung');
                        return;
                    }
                } else { // Tướng đen
                    if (!(nodeEnd.i >= 7 && nodeEnd.i <= 9 && nodeEnd.j >= 3 && nodeEnd.j <= 5)) {
                        console.log('Lỗi: Tướng phải đi trong phạm vi cung');
                        return;
                    }
                }
                console.log('Nước đi hợp lệ cho quân Tướng');
            }
            // Xử lý quân tốt
            else if (id.indexOf('tot') >= 0) {
                console.log('===== Kiểm tra nước đi quân TỐT =====');
                // Kiểm tra quân tốt ĐEN
                if (id.indexOf('den') >= 0) {
                    console.log('Kiểm tra tốt ĐEN');
                    if (nodeStart.i < 5) { // Nếu quân tốt đen đã qua sông
                        if (!(nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i - 1 || // Đi thẳng
                            nodeStart.i === nodeEnd.i && Math.abs(nodeStart.j - nodeEnd.j) === 1)) { // Đi ngang
                            console.log('Lỗi: Tốt đen đã qua sông chỉ được đi ngang 1 bước hoặc tiến 1 bước');
                            return;
                        }
                    } else {
                        if (!(nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i - 1)) { // Chỉ được đi thẳng
                            console.log('Lỗi: Tốt đen chưa qua sông chỉ được đi thẳng tiến 1 bước');
                            return;
                        }
                    }
                }
                // Kiểm tra quân tốt ĐỎ
                else {
                    console.log('Kiểm tra tốt ĐỎ');
                    if (nodeStart.i > 4) { // Nếu quân tốt đỏ đã qua sông
                        if (!(nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i + 1 || // Đi thẳng
                            nodeStart.i === nodeEnd.i && Math.abs(nodeStart.j - nodeEnd.j) === 1)) { // Đi ngang
                            console.log('Lỗi: Tốt đỏ đã qua sông chỉ được đi ngang 1 bước hoặc tiến 1 bước');
                            return;
                        }
                    } else {
                        if (!(nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i + 1)) { // Chỉ được đi thẳng
                            console.log('Lỗi: Tốt đỏ chưa qua sông chỉ được đi thẳng tiến 1 bước');
                            return;
                        }
                    }
                }
                console.log('Nước đi hợp lệ cho quân Tốt');
            }
            // Kiểm tra ăn quân
            if (nodeEnd.id != "") {
                // Kiểm tra ăn quân cùng màu
                if ((id.indexOf('do') >= 0 && nodeEnd.id.indexOf('do') >= 0) ||
                    (id.indexOf('den') >= 0 && nodeEnd.id.indexOf('den') >= 0)) {
                    console.log('Lỗi: Không thể ăn quân cùng màu');
                    return;
                } else {
                    console.log('Ăn quân:', nodeEnd.id);
                    objRemove = { id: nodeEnd.id };
                }
            }

            // xử lý gửi dữ liệu di chuyển lên server
            let params = new URL(document.location.toString()).searchParams;
            let roomId = params.get("roomId");
            var para = [{ id: id, fromi: nodeStart.i, fromj: nodeStart.j, toi: nodeEnd.i, toj: nodeEnd.j }];
            if (objRemove != null) {
                para.push(objRemove);
            }
            // Trong hàm dragEnd, sau phần gửi axios:
            axios({
                url: '/api/chess/move-check-node?roomId=' + roomId,
                method: 'Post',
                responseType: 'json',
                data: para
            }).then((response) => {
                // Cập nhật matrix và giao diện như cũ
                matrix[nodeStart.i][nodeStart.j].id = "";
                matrix[nodeEnd.i][nodeEnd.j].id = id;

                var obj = document.getElementById(id);
                obj.style.top = matrix[nodeEnd.i][nodeEnd.j].top + 'px';
                obj.style.left = matrix[nodeEnd.i][nodeEnd.j].left + 'px';

                if (objRemove != null) {
                    var temp = document.getElementById(objRemove.id);
                    temp.style.display = "none";
                }

                // Kiểm tra chiến thắng
                if (this.checkVictory() || this.checkKingsFaceToFace()) {
                    let winnerText = this.winner === 'do' ? 'ĐỎ' : 'ĐEN';
                    alert(`Người chơi ${winnerText} đã chiến thắng!`);
                    connection.invoke("SendGameOver", roomId, this.winner).catch(err => console.error(err.toString()));
                } else {
                    // Đổi lượt nếu chưa có người thắng
                    this.currentTurn = this.currentTurn === 'do' ? 'den' : 'do';
                    // Gửi thông tin về nước đi và lượt mới
                    let moveInfo = {
                        move: para,
                        nextTurn: this.currentTurn
                    };
                    connection.invoke("SendChessMove", JSON.stringify(moveInfo)).catch(err => console.error(err.toString()));
                }
            });
        },



        getValidMoves(piece, position, board) {
            const moves = [];
            const { i: startI, j: startJ } = position;

            // Đối tượng mô phỏng vị trí bắt đầu cho kiểm tra nước đi
            const nodeStart = {
                i: startI,
                j: startJ,
                id: piece.id
            };

            // Kiểm tra tất cả các ô trên bàn cờ
            for (let endI = 0; endI < 10; endI++) {
                for (let endJ = 0; endJ < 9; endJ++) {
                    // Bỏ qua vị trí hiện tại
                    if (endI === startI && endJ === startJ) continue;

                    const nodeEnd = {
                        i: endI,
                        j: endJ,
                        id: board[endI][endJ].id || ""
                    };

                    // Kiểm tra từng loại quân cờ
                    let isValidMove = false;

                    // Quân mã
                    if (piece.id.includes('ma')) {
                        const gapI = Math.abs(nodeEnd.i - nodeStart.i);
                        const gapJ = Math.abs(nodeEnd.j - nodeStart.j);

                        isValidMove = (gapI === 1 && gapJ === 2) || (gapJ === 1 && gapI === 2);

                        // Kiểm tra chặn mã
                        if (isValidMove) {
                            if ((gapI === 1 && gapJ === 2) && (nodeEnd.j > nodeStart.j)) {
                                if (board[nodeStart.i][nodeStart.j + 1].id !== "") isValidMove = false;
                            }
                            if ((gapI === 1 && gapJ === 2) && (nodeEnd.j < nodeStart.j)) {
                                if (board[nodeStart.i][nodeStart.j - 1].id !== "") isValidMove = false;
                            }
                            if ((gapI === 2 && gapJ === 1) && (nodeEnd.i > nodeStart.i)) {
                                if (board[nodeStart.i + 1][nodeStart.j].id !== "") isValidMove = false;
                            }
                            if ((gapI === 2 && gapJ === 1) && (nodeEnd.i < nodeStart.i)) {
                                if (board[nodeStart.i - 1][nodeStart.j].id !== "") isValidMove = false;
                            }
                        }
                    }
                    // Quân xe
                    else if (piece.id.includes('xe')) {
                        isValidMove = (nodeStart.i === nodeEnd.i || nodeStart.j === nodeEnd.j) &&
                            this.isPathClear(nodeStart, nodeEnd, board);
                    }
                    // Quân pháo
                    else if (piece.id.includes('phao')) {
                        if (nodeStart.i === nodeEnd.i || nodeStart.j === nodeEnd.j) {
                            const piecesBetween = this.countPiecesBetween(nodeStart, nodeEnd, board);
                            if (nodeEnd.id !== "") { // Ăn quân
                                isValidMove = piecesBetween === 1;
                            } else { // Di chuyển thông thường
                                isValidMove = piecesBetween === 0;
                            }
                        }
                    }
                    // Quân sĩ
                    else if (piece.id.includes('si')) {
                        isValidMove = Math.abs(nodeEnd.i - nodeStart.i) === 1 &&
                            Math.abs(nodeEnd.j - nodeStart.j) === 1;

                        // Kiểm tra phạm vi cung
                        if (isValidMove) {
                            if (piece.id.includes('do')) {
                                isValidMove = nodeEnd.i >= 0 && nodeEnd.i <= 2 && nodeEnd.j >= 3 && nodeEnd.j <= 5;
                            } else {
                                isValidMove = nodeEnd.i >= 7 && nodeEnd.i <= 9 && nodeEnd.j >= 3 && nodeEnd.j <= 5;
                            }
                        }
                    }
                    // Quân tượng
                    else if (piece.id.includes('tuong') && !piece.id.includes('chutuong')) {
                        isValidMove = Math.abs(nodeEnd.i - nodeStart.i) === 2 &&
                            Math.abs(nodeEnd.j - nodeStart.j) === 2;

                        if (isValidMove) {
                            // Kiểm tra chặn tượng
                            const midPoint = board[(nodeStart.i + nodeEnd.i) / 2][(nodeStart.j + nodeEnd.j) / 2];
                            if (midPoint.id !== "") isValidMove = false;

                            // Kiểm tra qua sông
                            if (piece.id.includes('do')) {
                                if (nodeEnd.i > 4) isValidMove = false;
                            } else {
                                if (nodeEnd.i < 5) isValidMove = false;
                            }
                        }
                    }
                    // Quân tướng
                    else if (piece.id.includes('chutuong')) {
                        isValidMove = (Math.abs(nodeEnd.i - nodeStart.i) === 1 && nodeEnd.j === nodeStart.j) ||
                            (Math.abs(nodeEnd.j - nodeStart.j) === 1 && nodeEnd.i === nodeStart.i);

                        if (isValidMove) {
                            // Kiểm tra phạm vi cung
                            if (piece.id.includes('do')) {
                                isValidMove = nodeEnd.i >= 0 && nodeEnd.i <= 2 && nodeEnd.j >= 3 && nodeEnd.j <= 5;
                            } else {
                                isValidMove = nodeEnd.i >= 7 && nodeEnd.i <= 9 && nodeEnd.j >= 3 && nodeEnd.j <= 5;
                            }
                        }
                    }
                    // Quân tốt
                    else if (piece.id.includes('tot')) {
                        if (piece.id.includes('den')) {
                            if (startI < 5) { // Đã qua sông
                                isValidMove = (nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i - 1) || // Đi thẳng
                                    (nodeStart.i === nodeEnd.i && Math.abs(nodeStart.j - nodeEnd.j) === 1); // Đi ngang
                            } else {
                                isValidMove = nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i - 1; // Chỉ đi thẳng
                            }
                        } else { // Tốt đỏ
                            if (startI > 4) { // Đã qua sông
                                isValidMove = (nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i + 1) || // Đi thẳng
                                    (nodeStart.i === nodeEnd.i && Math.abs(nodeStart.j - nodeEnd.j) === 1); // Đi ngang
                            } else {
                                isValidMove = nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i + 1; // Chỉ đi thẳng
                            }
                        }
                    }

                    // Kiểm tra ăn quân cùng màu
                    if (isValidMove && nodeEnd.id !== "") {
                        if ((piece.id.includes('do') && nodeEnd.id.includes('do')) ||
                            (piece.id.includes('den') && nodeEnd.id.includes('den'))) {
                            isValidMove = false;
                        }
                    }

                    // Nếu nước đi hợp lệ, thêm vào danh sách
                    if (isValidMove) {
                        moves.push({ i: endI, j: endJ });
                    }
                }
            }

            return moves;
        },


        // Đánh giá điểm của bàn cờ
        // Đánh giá bàn cờ với trọng số và các yếu tố chiến thuật
        evaluateBoard(board, depth) {
            const cacheKey = this.getBoardHash(board) + depth;
            if (evaluationCache.has(cacheKey)) {
                return evaluationCache.get(cacheKey);
            }

            let score = 0;
            let redMaterial = 0;
            let blackMaterial = 0;
            let redMobility = 0;
            let blackMobility = 0;
            let redControl = 0;
            let blackControl = 0;

            // Phân tích vật chất và vị trí
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 9; j++) {
                    const piece = board[i][j];
                    if (!piece.id) continue;

                    const isRed = piece.id.includes('do');
                    const pieceType = piece.id.replace('do', '').replace('den', '');
                    const baseValue = pieceValues[pieceType] || 0;

                    // Tính điểm vật chất
                    const materialScore = baseValue + this.getPositionalBonus(pieceType, { i, j }, isRed);
                    if (isRed) {
                        redMaterial += materialScore;
                        redMobility += this.calculateMobility(board, { i, j }, true);
                        redControl += this.calculateControl(board, { i, j }, true);
                    } else {
                        blackMaterial += materialScore;
                        blackMobility += this.calculateMobility(board, { i, j }, false);
                        blackControl += this.calculateControl(board, { i, j }, false);
                    }
                }
            }

            // Tổng hợp điểm với trọng số
            score = (redMaterial - blackMaterial) * 1.0 +  // Trọng số vật chất
                (redMobility - blackMobility) * 0.1 +  // Trọng số tính cơ động
                (redControl - blackControl) * 0.2;      // Trọng số kiểm soát

            // Thưởng cho giai đoạn cuối game
            if (this.isEndgame(redMaterial, blackMaterial)) {
                score += this.evaluateEndgame(board, redMaterial > blackMaterial);
            }

            // Cache kết quả
            evaluationCache.set(cacheKey, score);
            return score;
        },

        // Tính toán khả năng di chuyển của quân cờ
        calculateMobility(board, pos, isRed) {
            const piece = board[pos.i][pos.j];
            const moves = this.getValidMoves(piece, pos, board);
            return moves.length;
        },

        // Tính toán mức độ kiểm soát ô trên bàn cờ
        calculateControl(board, pos, isRed) {
            const piece = board[pos.i][pos.j];
            const moves = this.getValidMoves(piece, pos, board);
            let control = 0;

            for (const move of moves) {
                // Kiểm soát trung tâm được thưởng điểm cao hơn
                const centerBonus = this.isCentralSquare(move) ? 2 : 1;
                control += centerBonus;

                // Thưởng thêm cho việc kiểm soát các ô quan trọng
                if (this.isKeySquare(move, isRed)) {
                    control += 3;
                }
            }

            return control;
        },

        // Kiểm tra ô có phải trung tâm
        isCentralSquare(pos) {
            return pos.i >= 3 && pos.i <= 6 && pos.j >= 3 && pos.j <= 5;
        }
        ,
        // Kiểm tra ô quan trọng (gần tướng đối phương)
        isKeySquare(pos, isRed) {
            if (isRed) {
                return pos.i <= 2 && pos.j >= 3 && pos.j <= 5;
            } else {
                return pos.i >= 7 && pos.j >= 3 && pos.j <= 5;
            }
        },

        // Đánh giá giai đoạn cuối
        evaluateEndgame(board, isRedWinning) {
            let score = 0;
            const winningKingPos = this.findKingPosition(board, isRedWinning);
            const losingKingPos = this.findKingPosition(board, !isRedWinning);

            // Thưởng cho việc đẩy vua đối phương vào góc
            score += this.evaluateKingSafety(losingKingPos, !isRedWinning) * -2;

            // Thưởng cho khoảng cách giữa hai vua
            const kingDistance = this.getManhattanDistance(winningKingPos, losingKingPos);
            score += (14 - kingDistance) * 10;

            return score;
        },

        // Hàm tính điểm vị trí quân cờ
        getPositionalBonus(pieceType, position, isRed) {
            // Tính điểm dựa trên vị trí cho từng loại quân cờ (giá trị mẫu)
            const positionValues = {
                'totdo': [
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, -2, 0, 4, 0, -2, 0, 0],
                    [2, 0, 8, 0, 8, 0, 8, 0, 2],
                    [6, 12, 18, 18, 20, 18, 18, 12, 6],
                    [10, 20, 30, 34, 40, 34, 30, 20, 10],
                    [14, 26, 42, 60, 80, 60, 42, 26, 14],
                    [18, 36, 56, 80, 120, 80, 56, 36, 18],
                    [0, 3, 6, 9, 12, 9, 6, 3, 0]
                ],
                'totden': [
                    [0, 3, 6, 9, 12, 9, 6, 3, 0],
                    [18, 36, 56, 80, 120, 80, 56, 36, 18],
                    [14, 26, 42, 60, 80, 60, 42, 26, 14],
                    [10, 20, 30, 34, 40, 34, 30, 20, 10],
                    [6, 12, 18, 18, 20, 18, 18, 12, 6],
                    [2, 0, 8, 0, 8, 0, 8, 0, 2],
                    [0, 0, -2, 0, 4, 0, -2, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0]
                ],
                'mado': [
                    [0, -4, 0, 0, 0, 0, 0, -4, 0],
                    [0, 2, 4, 4, -2, 4, 4, 2, 0],
                    [4, 2, 8, 8, 4, 8, 8, 2, 4],
                    [2, 6, 8, 6, 10, 6, 8, 6, 2],
                    [4, 12, 16, 14, 12, 14, 16, 12, 4],
                    [6, 16, 14, 18, 16, 18, 14, 16, 6],
                    [8, 24, 18, 24, 20, 24, 18, 24, 8],
                    [12, 14, 16, 20, 18, 20, 16, 14, 12],
                    [4, 10, 28, 16, 8, 16, 28, 10, 4],
                    [4, 8, 16, 12, 4, 12, 16, 8, 4]
                ],
                'maden': [
                    [4, 8, 16, 12, 4, 12, 16, 8, 4],
                    [4, 10, 28, 16, 8, 16, 28, 10, 4],
                    [12, 14, 16, 20, 18, 20, 16, 14, 12],
                    [8, 24, 18, 24, 20, 24, 18, 24, 8],
                    [6, 16, 14, 18, 16, 18, 14, 16, 6],
                    [4, 12, 16, 14, 12, 14, 16, 12, 4],
                    [2, 6, 8, 6, 10, 6, 8, 6, 2],
                    [4, 2, 8, 8, 4, 8, 8, 2, 4],
                    [0, 2, 4, 4, -2, 4, 4, 2, 0],
                    [0, -4, 0, 0, 0, 0, 0, -4, 0]
                ],
                'xedo': [
                    [-2, 10, 6, 14, 12, 14, 6, 10, -2],
                    [8, 4, 8, 16, 8, 16, 8, 4, 8],
                    [4, 8, 6, 14, 12, 14, 6, 8, 4],
                    [6, 10, 8, 14, 14, 14, 8, 10, 6],
                    [12, 16, 14, 20, 20, 20, 14, 16, 12],
                    [12, 14, 12, 18, 18, 18, 12, 14, 12],
                    [12, 18, 16, 22, 22, 22, 16, 18, 12],
                    [12, 12, 12, 18, 18, 18, 12, 12, 12],
                    [16, 20, 18, 24, 26, 24, 18, 20, 16],
                    [14, 14, 12, 18, 16, 18, 12, 14, 14]
                ],
                'xeden': [
                    [14, 14, 12, 18, 16, 18, 12, 14, 14],
                    [16, 20, 18, 24, 26, 24, 18, 20, 16],
                    [12, 12, 12, 18, 18, 18, 12, 12, 12],
                    [12, 18, 16, 22, 22, 22, 16, 18, 12],
                    [12, 14, 12, 18, 18, 18, 12, 14, 12],
                    [12, 16, 14, 20, 20, 20, 14, 16, 12],
                    [6, 10, 8, 14, 14, 14, 8, 10, 6],
                    [4, 8, 6, 14, 12, 14, 6, 8, 4],
                    [8, 4, 8, 16, 8, 16, 8, 4, 8],
                    [-2, 10, 6, 14, 12, 14, 6, 10, -2]
                ],
                'phaodo': [
                    [0, 0, 2, 6, 6, 6, 2, 0, 0],
                    [0, 2, 4, 6, 6, 6, 4, 2, 0],
                    [4, 0, 8, 6, 10, 6, 8, 0, 4],
                    [0, 0, 0, 2, 4, 2, 0, 0, 0],
                    [-2, 0, 0, 0, 0, 0, 0, 0, -2],
                    [-2, 0, 0, 0, 0, 0, 0, 0, -2],
                    [0, 0, 0, 2, 4, 2, 0, 0, 0],
                    [4, 0, 8, 6, 10, 6, 8, 0, 4],
                    [0, 2, 4, 6, 6, 6, 4, 2, 0],
                    [0, 0, 2, 6, 6, 6, 2, 0, 0]
                ],
                'phaoden': [
                    [0, 0, 2, 6, 6, 6, 2, 0, 0],
                    [0, 2, 4, 6, 6, 6, 4, 2, 0],
                    [4, 0, 8, 6, 10, 6, 8, 0, 4],
                    [0, 0, 0, 2, 4, 2, 0, 0, 0],
                    [-2, 0, 0, 0, 0, 0, 0, 0, -2],
                    [-2, 0, 0, 0, 0, 0, 0, 0, -2],
                    [0, 0, 0, 2, 4, 2, 0, 0, 0],
                    [4, 0, 8, 6, 10, 6, 8, 0, 4],
                    [0, 2, 4, 6, 6, 6, 4, 2, 0],
                    [0, 0, 2, 6, 6, 6, 2, 0, 0]
                ]
            };
            return positionValues[pieceType] || 0;
        },
        // Hàm đánh giá mối đe dọa (tấn công và phòng thủ)
        evaluateThreats(board, position, isRed) {
            let threatScore = 0;
            const opponentColor = isRed ? 'den' : 'do';

            // Kiểm tra các nước đi của đối thủ để xác định quân nào đang bị đe dọa
            const opponentMoves = this.getAllMoves(board, opponentColor);
            for (const move of opponentMoves) {
                if (move.to.i === position.i && move.to.j === position.j) {
                    threatScore -= 10;  // Bị đe dọa
                }
            }

            return threatScore;
        },

        // Hàm lấy tất cả nước đi của một bên
        getAllMoves(board, color) {
            let allMoves = [];
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 9; j++) {
                    const piece = board[i][j];
                    if (piece.id && piece.id.includes(color)) {
                        const moves = this.getValidMoves(piece, { i, j }, board);
                        allMoves = allMoves.concat(moves.map(move => ({ from: { i, j }, to: move })));
                    }
                }
            }
            return allMoves;
        },

        // Tìm vị trí vua
        findKingPosition(board, isRed) {
            const kingId = isRed ? 'chutuongdo' : 'chutuongden';
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 9; j++) {
                    if (board[i][j].id === kingId) {
                        return { i, j };
                    }
                }
            }
            return null;
        },

        // Tính khoảng cách Manhattan
        getManhattanDistance(pos1, pos2) {
            if (!pos1 || !pos2) {
                console.error("One of the positions is null:", pos1, pos2);
                return 0; // Hoặc giá trị mặc định mà bạn muốn
            }
            return Math.abs(pos1.i - pos2.i) + Math.abs(pos1.j - pos2.j);
        },

        // Đánh giá an toàn của vua
        evaluateKingSafety(kingPos, isRed) {
            // Kiểm tra xem kingPos có phải là null không
            if (!kingPos) {
                console.error("King position is null.");
                return 0; // Hoặc giá trị an toàn mặc định
            }
            console.log("King Position:", kingPos);

            let safety = 0;
            const centerJ = 4;

            // Khuyến khích vua ở sau các quân khác
            safety += isRed ? (9 - kingPos.i) : kingPos.i;

            // Khuyến khích vua ở gần trung tâm ngang
            safety += 4 - Math.abs(kingPos.j - centerJ);

            return safety;
        },

        // Kiểm tra giai đoạn cuối
        isEndgame(redMaterial, blackMaterial) {
            const totalMaterial = redMaterial + blackMaterial;
            return totalMaterial < (pieceValues.xe * 4);  // Ví dụ: ít hơn 4 xe
        },

        // Tạo hash của bàn cờ để cache
        getBoardHash(board) {
            return board.map(row => row.map(cell => cell.id).join('')).join('');
        },

        // Minimax với alpha-beta pruning và move ordering
        minimax(board, depth, alpha, beta, maximizingPlayer, color) {
            // Base cases
            if (depth === 0 || this.checkVictory(board)) {
                return this.evaluateBoard(board, depth);
            }

            const moves = this.getAllMovesOrdered(board, color);

            if (maximizingPlayer) {
                let maxEval = -Infinity;
                for (const move of moves) {
                    const newBoard = this.makeMove(board, move);
                    const evalScore = this.minimax(newBoard, depth - 1, alpha, beta, false, this.getOppositeColor(color));
                    maxEval = Math.max(maxEval, evalScore);
                    alpha = Math.max(alpha, evalScore);
                    if (beta <= alpha) break;  // Alpha-beta cut-off
                }
                return maxEval;
            } else {
                let minEval = Infinity;
                for (const move of moves) {
                    const newBoard = this.makeMove(board, move);
                    const evalScore = this.minimax(newBoard, depth - 1, alpha, beta, true, this.getOppositeColor(color));
                    minEval = Math.min(minEval, evalScore);
                    beta = Math.min(beta, evalScore);
                    if (beta <= alpha) break;  // Alpha-beta cut-off
                }
                return minEval;
            }
        },
        // Lấy tất cả nước đi và sắp xếp theo độ ưu tiên
        getAllMovesOrdered(board, color) {
            const moves = [];
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 9; j++) {
                    const piece = board[i][j];
                    if (piece.id && piece.id.includes(color)) {
                        const pieceMoves = this.getValidMoves(piece, { i, j }, board);
                        for (const move of pieceMoves) {
                            moves.push({
                                from: { i, j },
                                to: move,
                                score: this.evaluateMove(board, { i, j }, move)
                            });
                        }
                    }
                }
            }
            // Sắp xếp nước đi theo điểm số
            return moves.sort((a, b) => b.score - a.score);
        },

        // Đánh giá một nước đi cụ thể
        evaluateMove(board, from, to) {
            let score = 0;
            const piece = board[from.i][from.j];
            const targetPiece = board[to.i][to.j];

            // Điểm cho việc ăn quân
            if (targetPiece.id) {
                const targetType = targetPiece.id.replace('do', '').replace('den', '');
                score += pieceValues[targetType] * 10;
            }

            // Điểm cho việc di chuyển đến vị trí tốt
            score += this.getPositionalBonus(piece.id, to, piece.id.includes('do'));

            // Điểm cho việc tấn công
            score += this.evaluateAttack(board, to) * 5;

            // Điểm cho việc phòng thủ
            score += this.evaluateDefense(board, from, to) * 3;

            return score;
        },

        // Đánh giá khả năng tấn công của một nước đi
        evaluateAttack(board, pos) {
            let score = 0;
            const opponentKingPos = this.findKingPosition(board, !board[pos.i][pos.j].id.includes('do'));

            if (opponentKingPos) {
                // Thưởng cho việc tiếp cận vua đối phương
                const distance = this.getManhattanDistance(pos, opponentKingPos);
                score += (14 - distance) * 2;
            }

            return score;
        },

        // Đánh giá khả năng phòng thủ của một nước đi
        evaluateDefense(board, from, to) {
            let score = 0;
            const ownKingPos = this.findKingPosition(board, board[from.i][from.j].id.includes('do'));

            if (ownKingPos) {
                // Thưởng cho việc bảo vệ vua của mình
                const oldDistance = this.getManhattanDistance(from, ownKingPos);
                const newDistance = this.getManhattanDistance(to, ownKingPos);

                if (newDistance < oldDistance) {
                    score += 5;
                }
            }

            return score;
        },

        // Hàm tìm nước đi tốt nhất với iterative deepening
        getBestMove(board, aiColor, timeLimit = 3000) {
            const startTime = Date.now();
            let bestMove = null;
            let depth = 1;

            while (Date.now() - startTime < timeLimit) {
                const move = this.findBestMoveAtDepth(board, depth, aiColor);
                if (move) {
                    bestMove = move;
                }
                depth++;
            }

            return bestMove;
        },
        // Tìm nước đi tốt nhất ở độ sâu cụ thể
        findBestMoveAtDepth(board, depth, aiColor) {
            const isMaximizing = aiColor === 'do';
            let bestMove = null;
            let bestValue = isMaximizing ? -Infinity : Infinity;

            const moves = this.getAllMovesOrdered(board, aiColor);

            for (const move of moves) {
                const newBoard = this.makeMove(board, move);
                const value = this.minimax(newBoard, depth - 1, -Infinity, Infinity, !isMaximizing, this.getOppositeColor(aiColor));

                if (isMaximizing && value > bestValue) {
                    bestValue = value;
                    bestMove = move;
                } else if (!isMaximizing && value < bestValue) {
                    bestValue = value;
                    bestMove = move;
                }
            }

            return bestMove;
        },

        // Helper functions
        makeMove(board, move) {
            const newBoard = JSON.parse(JSON.stringify(board));
            newBoard[move.to.i][move.to.j] = newBoard[move.from.i][move.from.j];
            newBoard[move.from.i][move.from.j] = { id: '' };
            return newBoard;
        },

        getOppositeColor(color) {
            return color === 'do' ? 'den' : 'do';
        },


        // Cập nhật makeAIMove để sử dụng AI mới
        makeAIMove() {
            if (this.currentTurn === this.aiColor && this.playWithAI && !this.gameOver) {
                console.log("AI đang tính toán nước đi...");

                // Tạo bản sao của bàn cờ hiện tại
                const currentBoard = JSON.parse(JSON.stringify(matrix));

                // Lấy nước đi tốt nhất từ AI
                const bestMove = this.getBestMove(currentBoard, this.aiColor);

                if (bestMove) {
                    console.log("AI đã chọn nước đi:", bestMove);

                    // Kiểm tra xem có quân cờ bị ăn không
                    let objRemove = null;
                    if (matrix[bestMove.to.i][bestMove.to.j].id !== "") {
                        objRemove = {
                            id: matrix[bestMove.to.i][bestMove.to.j].id
                        };
                    }

                    // Chuẩn bị dữ liệu nước đi
                    const moveData = [{
                        id: matrix[bestMove.from.i][bestMove.from.j].id,
                        fromi: bestMove.from.i,
                        fromj: bestMove.from.j,
                        toi: bestMove.to.i,
                        toj: bestMove.to.j
                    }];

                    if (objRemove) {
                        moveData.push(objRemove);
                    }

                    // Cập nhật bàn cờ
                    let params = new URL(document.location.toString()).searchParams;
                    let roomId = params.get("roomId");

                    // Gửi nước đi lên server
                    axios({
                        url: '/api/chess/move-check-node?roomId=' + roomId,
                        method: 'Post',
                        responseType: 'json',
                        data: moveData
                    }).then((response) => {
                        // Thực hiện di chuyển trên giao diện
                        matrix[bestMove.from.i][bestMove.from.j].id = "";
                        matrix[bestMove.to.i][bestMove.to.j].id = moveData[0].id;

                        const piece = document.getElementById(moveData[0].id);
                        piece.style.top = matrix[bestMove.to.i][bestMove.to.j].top + 'px';
                        piece.style.left = matrix[bestMove.to.i][bestMove.to.j].left + 'px';

                        // Xử lý quân bị ăn
                        if (objRemove) {
                            const capturedPiece = document.getElementById(objRemove.id);
                            if (capturedPiece) {
                                capturedPiece.style.display = "none";
                            }
                        }

                        // Kiểm tra chiến thắng
                        if (this.checkVictory() || this.checkKingsFaceToFace()) {
                            let winnerText = this.winner === 'do' ? 'ĐỎ' : 'ĐEN';
                            alert(`Người chơi ${winnerText} đã chiến thắng!`);
                            connection.invoke("SendGameOver", roomId, this.winner)
                                .catch(err => console.error(err.toString()));
                        } else {
                            // Chuyển lượt
                            this.currentTurn = this.currentTurn === 'do' ? 'den' : 'do';

                            // Gửi thông tin nước đi qua SignalR
                            let moveInfo = {
                                move: moveData,
                                nextTurn: this.currentTurn
                            };
                            connection.invoke("SendChessMove", JSON.stringify(moveInfo))
                                .catch(err => console.error(err.toString()));
                        }
                    }).catch(err => console.error("Lỗi khi thực hiện nước đi của AI:", err));
                } else {
                    console.error("AI không tìm được nước đi hợp lệ");
                }
            }
        },

        applyMove(move) {
            // Cập nhật nước đi vào bàn cờ
            matrix[move.fromi][move.fromj].id = "";
            var nodeEnd = matrix[move.toi][move.toj];
            nodeEnd.id = move.id;

            var obj = document.getElementById(move.id);
            obj.style.top = nodeEnd.top + 'px';
            obj.style.left = nodeEnd.left + 'px';

            if (move.capture) {
                var capturedPiece = document.getElementById(move.capture.id);
                capturedPiece.style.display = "none";
            }
        }


    },
    mounted: function () {
        this.getChessNode();
        let params = new URL(document.location.toString()).searchParams;
        let roomId = params.get("roomId");

        // Lắng nghe sự kiện nhận nước đi từ server
        connection.on("ReceiveChessMove", (message) => {
            let moveInfo = JSON.parse(message);

            // Áp dụng nước đi vào bàn cờ
            this.applyMove(moveInfo.move[0]);

            // Cập nhật lượt đi
            this.currentTurn = moveInfo.nextTurn;

            // Nếu đang chơi với AI và đến lượt AI, thực hiện nước đi của AI
            if (this.playWithAI && this.currentTurn === this.aiColor) {
                // Thêm setTimeout để tránh việc AI đánh quá nhanh
                setTimeout(() => {
                    this.makeAIMove();
                }, 500);
            }
        });

        // Xử lý kết thúc game
        connection.on("ReceiveGameOver", (winner) => {
            this.gameOver = true;
            this.winner = winner;
            let winnerText = winner === 'do' ? 'ĐỎ' : 'ĐEN';
            alert(`Người chơi ${winnerText} đã chiến thắng!`);
        });
    }
});

// Thêm sự kiện click cho nút "Play with AI"
document.getElementById("playWithAI").addEventListener("click", function () {
    app.playWithAI = !app.playWithAI;
    document.getElementById("messages").innerText = app.playWithAI
        ? "Chế độ chơi với AI đã được bật. AI sẽ chơi màu đỏ."
        : "Chế độ chơi với AI đã được tắt.";

    // Kích hoạt nước đi của AI nếu AI đi trước
    if (app.playWithAI && app.currentTurn === app.aiColor) {
        app.makeAIMove();
    }
});

document.getElementById("createRoom").addEventListener("click", async () => {
    const response = await fetch('/api/Room/create', { method: 'POST' });
    if (response.ok) {
        const data = await response.json();
        currentRoomId = data.roomId;
        document.getElementById("messages").innerText = `Room created. Room ID: ${currentRoomId}`;
    } else {
        console.error("Failed to create room:", response.statusText);
    }
});
let currentRoomId = null;
let playerId = prompt("Enter your Player ID:");

document.getElementById("joinRoom").addEventListener("click", async () => {
    currentRoomId = document.getElementById("roomIdInput").value;
    await connection.invoke("JoinRoom", currentRoomId, playerId);
});

document.getElementById("leaveRoom").addEventListener("click", async () => {
    if (currentRoomId) {
        await connection.invoke("LeaveRoom", currentRoomId, playerId);
        currentRoomId = null;
        document.getElementById("messages").innerText = "You have left the room.";
    }
});

document.getElementById("sendMessage").addEventListener("click", async () => {
    const message = document.getElementById("messageInput").value;
    if (currentRoomId && message) {
        await connection.invoke("SendMessage", currentRoomId, playerId, message);
        document.getElementById("messageInput").value = ""; // Xóa ô nhập tin nhắn
    }
});

connection.on("ReceiveMessage", (message) => {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML += `<p>${message}</p>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

