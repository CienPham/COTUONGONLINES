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
                alert(`Chiến thắng: ${this.winner}`);
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
                alert('Lỗi: Chưa đến lượt của bạn');
                return false;
            }
            return true;
        },

        dragStart(event) {
            if (this.gameOver) {
                alert('Trò chơi đã kết thúc!');
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
                        al.log('Lỗi: Mã bị chặn khi đi ngang trái');
                        return;
                    }
                }
                if ((gapI == 2 && gapJ == 1) && (nodeEnd.i > nodeStart.i)) {
                    if (matrix[nodeStart.i + 1][nodeStart.j].id != "") {
                        alert('Lỗi: Mã bị chặn khi đi xuống');
                        return;
                    }
                }
                if ((gapI == 2 && gapJ == 1) && (nodeEnd.i < nodeStart.i)) {
                    if (matrix[nodeStart.i - 1][nodeStart.j].id != "") {
                        alert('Lỗi: Mã bị chặn khi đi lên');
                        return;
                    }
                }
                console.log('Nước đi hợp lệ cho quân Mã');
            }
            // Xử lý quân xe
            else if (id.indexOf('xe') >= 0) {
                console.log('===== Kiểm tra nước đi quân XE =====');
                if (!(nodeStart.i === nodeEnd.i || nodeStart.j === nodeEnd.j)) {
                    alert('Lỗi: Xe chỉ được đi ngang hoặc dọc');
                    return;
                }
                if (!this.isPathClear(nodeStart, nodeEnd, matrix)) {
                    alert('Lỗi: Đường đi của Xe bị cản bởi quân khác');
                    return;
                }
                console.log('Nước đi hợp lệ cho quân Xe');
            }
            // Xử lý quân pháo
            else if (id.indexOf('phao') >= 0) {
                console.log('===== Kiểm tra nước đi quân PHÁO =====');
                if (!(nodeStart.i === nodeEnd.i || nodeStart.j === nodeEnd.j)) {
                    alert('Lỗi: Pháo chỉ được đi ngang hoặc dọc');
                    return;
                }
                var piecesBetween = this.countPiecesBetween(nodeStart, nodeEnd, matrix);
                if (nodeEnd.id !== "") { // Nếu điểm đến có quân (ăn quân)
                    if (piecesBetween !== 1) {
                        alert('Lỗi: Pháo cần đúng 1 quân để ăn quân (hiện có ' + piecesBetween + ' quân)');
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
                    alert('Lỗi: Sĩ chỉ được đi chéo 1 ô');
                    return;
                }
                // Kiểm tra phạm vi cung
                if (id.indexOf('do') >= 0) { // Sĩ đỏ
                    if (!(nodeEnd.i >= 0 && nodeEnd.i <= 2 && nodeEnd.j >= 3 && nodeEnd.j <= 5)) {
                        alert('Lỗi: Sĩ phải đi trong phạm vi cung');
                        return;
                    }
                } else { // Sĩ đen
                    if (!(nodeEnd.i >= 7 && nodeEnd.i <= 9 && nodeEnd.j >= 3 && nodeEnd.j <= 5)) {
                        alert('Lỗi: Sĩ phải đi trong phạm vi cung');
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
                    alert('Lỗi: Tượng phải đi chéo 2 ô');
                    return;
                }
                // Kiểm tra chặn tượng
                var midPoint = matrix[(nodeStart.i + nodeEnd.i) / 2][(nodeStart.j + nodeEnd.j) / 2];
                if (midPoint.id !== "") {
                    alert('Lỗi: Tượng bị chặn ở điểm giữa');
                    return;
                }
                // Kiểm tra qua sông
                if (id.indexOf('do') >= 0) { // Tượng đỏ
                    if (nodeEnd.i > 4) {
                        alert('Lỗi: Tượng không được qua sông');
                        return;
                    }
                } else { // Tượng đen
                    if (nodeEnd.i < 5) {
                        alert('Lỗi: Tượng không được qua sông');
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
                    alert('Lỗi: Tướng chỉ được đi 1 ô theo chiều dọc hoặc ngang');
                    return;
                }
                // Kiểm tra phạm vi cung
                if (id.indexOf('do') >= 0) { // Tướng đỏ
                    if (!(nodeEnd.i >= 0 && nodeEnd.i <= 2 && nodeEnd.j >= 3 && nodeEnd.j <= 5)) {
                        alert('Lỗi: Tướng phải đi trong phạm vi cung');
                        return;
                    }
                } else { // Tướng đen
                    if (!(nodeEnd.i >= 7 && nodeEnd.i <= 9 && nodeEnd.j >= 3 && nodeEnd.j <= 5)) {
                        alert('Lỗi: Tướng phải đi trong phạm vi cung');
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
                            alert('Lỗi: Tốt đen đã qua sông chỉ được đi ngang 1 bước hoặc tiến 1 bước');
                            return;
                        }
                    } else {
                        if (!(nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i - 1)) { // Chỉ được đi thẳng
                            alert('Lỗi: Tốt đen chưa qua sông chỉ được đi thẳng tiến 1 bước');
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
                            alert('Lỗi: Tốt đỏ đã qua sông chỉ được đi ngang 1 bước hoặc tiến 1 bước');
                            return;
                        }
                    } else {
                        if (!(nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i + 1)) { // Chỉ được đi thẳng
                            alert('Lỗi: Tốt đỏ chưa qua sông chỉ được đi thẳng tiến 1 bước');
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
                    alert('Lỗi: Không thể ăn quân cùng màu');
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
            evaluateBoard(board) {
                let score = 0;

                for (let i = 0; i < 10; i++) {
                    for (let j = 0; j < 9; j++) {
                        const piece = board[i][j];
                        if (piece.id) {
                            const isRed = piece.id.includes('do');
                            const pieceType = piece.id.replace('do', '').replace('den', '');
                            const value = pieceValues[pieceType] || 0;

                            score += isRed ? value : -value;
                        }
                    }
                }

                return score;
            },

            // Thuật toán minimax với alpha-beta pruning
            minimax(board, depth, alpha, beta, maximizingPlayer) {
                if (depth === 0 || this.checkVictory()) {
                    return this.evaluateBoard(board);
                }

                if (maximizingPlayer) {
                    let maxEval = -Infinity;
                    for (let i = 0; i < 10; i++) {
                        for (let j = 0; j < 9; j++) {
                            const piece = board[i][j];
                            if (piece.id && piece.id.includes('do')) {
                                const moves = this.getValidMoves(piece, { i, j }, board);

                                for (const move of moves) {
                                    // Tạo bản sao của bàn cờ
                                    const newBoard = JSON.parse(JSON.stringify(board));
                                    // Thực hiện nước đi
                                    newBoard[move.i][move.j] = newBoard[i][j];
                                    newBoard[i][j] = { id: '' };

                                    const evalScore = this.minimax(newBoard, depth - 1, alpha, beta, false);
                                    maxEval = Math.max(maxEval, evalScore);
                                    alpha = Math.max(alpha, evalScore);
                                    if (beta <= alpha)
                                        break;
                                }
                            }
                        }
                    }
                    return maxEval;
                } else {
                    let minEval = Infinity;
                    for (let i = 0; i < 10; i++) {
                        for (let j = 0; j < 9; j++) {
                            const piece = board[i][j];
                            if (piece.id && piece.id.includes('den')) {
                                const moves = this.getValidMoves(piece, { i, j }, board);

                                for (const move of moves) {
                                    const newBoard = JSON.parse(JSON.stringify(board));
                                    newBoard[move.i][move.j] = newBoard[i][j];
                                    newBoard[i][j] = { id: '' };

                                    const evalScore = this.minimax(newBoard, depth - 1, alpha, beta, true);
                                    minEval = Math.min(minEval, evalScore);
                                    beta = Math.min(beta, evalScore);
                                    if (beta <= alpha)
                                        break;
                                }
                            }
                        }
                    }
                    return minEval;
                }
            },

            // Hàm tìm nước đi tốt nhất cho AI
        getBestMove(board, aiColor) {
            let bestMove = null;
            let bestValue = aiColor === 'do' ? -Infinity : Infinity;
            const isMaximizing = aiColor === 'do';

            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 9; j++) {
                    const piece = board[i][j];
                    if (piece && piece.id && piece.id.includes(aiColor)) {  // Added check for piece
                        const moves = this.getValidMoves(piece, { i, j }, board);

                        for (const move of moves) {
                            const newBoard = JSON.parse(JSON.stringify(board));
                            newBoard[move.i][move.j] = newBoard[i][j];
                            newBoard[i][j] = { id: '' };

                            const value = this.minimax(newBoard, 3, -Infinity, Infinity, !isMaximizing);

                            if (isMaximizing && value > bestValue) {
                                bestValue = value;
                                bestMove = { from: { i, j }, to: move };
                            } else if (!isMaximizing && value < bestValue) {
                                bestValue = value;
                                bestMove = { from: { i, j }, to: move };
                            }
                        }
                    }
                }
            }

            return bestMove;
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
                    alert("AI đã chọn nước đi:", bestMove);

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

