//class ChessAI {
//    constructor(depth = 3) {
//        this.depth = depth;
//        this.currentPlayer = 'do';
//        this.evaluationCache = new Map();
//        this.moveCache = new Map();

//        this.weights = {
//            materialValue: 1.0,
//            positionValue: 0.8,
//            protection: 0.5,
//            attack: 0.6,
//            mobility: 0.3,
//            kingThreat: 1.2
//        };
//    }

//    evaluateBoard(matrix) {
//        const cacheKey = JSON.stringify(matrix);
//        if (this.evaluationCache.has(cacheKey)) {
//            return this.evaluationCache.get(cacheKey);
//        }

//        let score = 0;

//        score += this.evaluateMaterialAndPosition(matrix) * this.weights.materialValue;
//        score += this.evaluateProtection(matrix) * this.weights.protection;
//        score += this.evaluateAttacks(matrix) * this.weights.attack;
//        score += this.evaluateMobility(matrix) * this.weights.mobility;
//        score += this.evaluateKingThreat(matrix) * this.weights.kingThreat;

//        this.evaluationCache.set(cacheKey, score);
//        return score;
//    }

//    evaluateMaterialAndPosition(matrix) {
//        let score = 0;
//        for (let i = 0; i < matrix.length; i++) {
//            for (let j = 0; j < matrix[i].length; j++) {
//                const piece = matrix[i][j];
//                if (piece.id) {
//                    const isRed = piece.id.includes('do');
//                    const baseValue = this.getPieceValue(piece.id);
//                    const positionValue = this.getPositionValue(piece.id, i, j);

//                    if (isRed) {
//                        score += baseValue + positionValue;
//                    } else {
//                        score -= baseValue + positionValue;
//                    }
//                }
//            }
//        }
//        return score;
//    }

//    getPieceValue(pieceId) {
//        const pieceValues = {
//            'chutuong': 10000,
//            'si': 200,
//            'tuong': 200,
//            'ma': 400,
//            'xe': 900,
//            'phao': 450,
//            'tot': 100
//        };

//        for (const [key, value] of Object.entries(pieceValues)) {
//            if (pieceId.includes(key)) {
//                return value;
//            }
//        }
//        return 0;
//    }

//    getPositionValue(pieceId, i, j) {
//        const positionValues = {
//            'totdo': [
//                [0, 0, 0, 0, 0, 0, 0, 0, 0],
//                [0, 0, 0, 0, 0, 0, 0, 0, 0],
//                [0, 0, 0, 0, 0, 0, 0, 0, 0],
//                [0, 0, -2, 0, 4, 0, -2, 0, 0],
//                [2, 0, 8, 0, 8, 0, 8, 0, 2],
//                [6, 12, 18, 18, 20, 18, 18, 12, 6],
//                [10, 20, 30, 34, 40, 34, 30, 20, 10],
//                [14, 26, 42, 60, 80, 60, 42, 26, 14],
//                [18, 36, 56, 80, 120, 80, 56, 36, 18],
//                [0, 3, 6, 9, 12, 9, 6, 3, 0]
//            ],
//            'totden': [
//                [0, 3, 6, 9, 12, 9, 6, 3, 0],
//                [18, 36, 56, 80, 120, 80, 56, 36, 18],
//                [14, 26, 42, 60, 80, 60, 42, 26, 14],
//                [10, 20, 30, 34, 40, 34, 30, 20, 10],
//                [6, 12, 18, 18, 20, 18, 18, 12, 6],
//                [2, 0, 8, 0, 8, 0, 8, 0, 2],
//                [0, 0, -2, 0, 4, 0, -2, 0, 0],
//                [0, 0, 0, 0, 0, 0, 0, 0, 0],
//                [0, 0, 0, 0, 0, 0, 0, 0, 0],
//                [0, 0, 0, 0, 0, 0, 0, 0, 0]
//            ],
//            'mado': [
//                [0, -4, 0, 0, 0, 0, 0, -4, 0],
//                [0, 2, 4, 4, -2, 4, 4, 2, 0],
//                [4, 2, 8, 8, 4, 8, 8, 2, 4],
//                [2, 6, 8, 6, 10, 6, 8, 6, 2],
//                [4, 12, 16, 14, 12, 14, 16, 12, 4],
//                [6, 16, 14, 18, 16, 18, 14, 16, 6],
//                [8, 24, 18, 24, 20, 24, 18, 24, 8],
//                [12, 14, 16, 20, 18, 20, 16, 14, 12],
//                [4, 10, 28, 16, 8, 16, 28, 10, 4],
//                [4, 8, 16, 12, 4, 12, 16, 8, 4]
//            ],
//            'maden': [
//                [4, 8, 16, 12, 4, 12, 16, 8, 4],
//                [4, 10, 28, 16, 8, 16, 28, 10, 4],
//                [12, 14, 16, 20, 18, 20, 16, 14, 12],
//                [8, 24, 18, 24, 20, 24, 18, 24, 8],
//                [6, 16, 14, 18, 16, 18, 14, 16, 6],
//                [4, 12, 16, 14, 12, 14, 16, 12, 4],
//                [2, 6, 8, 6, 10, 6, 8, 6, 2],
//                [4, 2, 8, 8, 4, 8, 8, 2, 4],
//                [0, 2, 4, 4, -2, 4, 4, 2, 0],
//                [0, -4, 0, 0, 0, 0, 0, -4, 0]
//            ],
//            'xedo': [
//                [-2, 10, 6, 14, 12, 14, 6, 10, -2],
//                [8, 4, 8, 16, 8, 16, 8, 4, 8],
//                [4, 8, 6, 14, 12, 14, 6, 8, 4],
//                [6, 10, 8, 14, 14, 14, 8, 10, 6],
//                [12, 16, 14, 20, 20, 20, 14, 16, 12],
//                [12, 14, 12, 18, 18, 18, 12, 14, 12],
//                [12, 18, 16, 22, 22, 22, 16, 18, 12],
//                [12, 12, 12, 18, 18, 18, 12, 12, 12],
//                [16, 20, 18, 24, 26, 24, 18, 20, 16],
//                [14, 14, 12, 18, 16, 18, 12, 14, 14]
//            ],
//            'xeden': [
//                [14, 14, 12, 18, 16, 18, 12, 14, 14],
//                [16, 20, 18, 24, 26, 24, 18, 20, 16],
//                [12, 12, 12, 18, 18, 18, 12, 12, 12],
//                [12, 18, 16, 22, 22, 22, 16, 18, 12],
//                [12, 14, 12, 18, 18, 18, 12, 14, 12],
//                [12, 16, 14, 20, 20, 20, 14, 16, 12],
//                [6, 10, 8, 14, 14, 14, 8, 10, 6],
//                [4, 8, 6, 14, 12, 14, 6, 8, 4],
//                [8, 4, 8, 16, 8, 16, 8, 4, 8],
//                [-2, 10, 6, 14, 12, 14, 6, 10, -2]
//            ],
//            'phaodo': [
//                [0, 0, 2, 6, 6, 6, 2, 0, 0],
//                [0, 2, 4, 6, 6, 6, 4, 2, 0],
//                [4, 0, 8, 6, 10, 6, 8, 0, 4],
//                [0, 0, 0, 2, 4, 2, 0, 0, 0],
//                [-2, 0, 0, 0, 0, 0, 0, 0, -2],
//                [-2, 0, 0, 0, 0, 0, 0, 0, -2],
//                [0, 0, 0, 2, 4, 2, 0, 0, 0],
//                [4, 0, 8, 6, 10, 6, 8, 0, 4],
//                [0, 2, 4, 6, 6, 6, 4, 2, 0],
//                [0, 0, 2, 6, 6, 6, 2, 0, 0]
//            ],
//            'phaoden': [
//                [0, 0, 2, 6, 6, 6, 2, 0, 0],
//                [0, 2, 4, 6, 6, 6, 4, 2, 0],
//                [4, 0, 8, 6, 10, 6, 8, 0, 4],
//                [0, 0, 0, 2, 4, 2, 0, 0, 0],
//                [-2, 0, 0, 0, 0, 0, 0, 0, -2],
//                [-2, 0, 0, 0, 0, 0, 0, 0, -2],
//                [0, 0, 0, 2, 4, 2, 0, 0, 0],
//                [4, 0, 8, 6, 10, 6, 8, 0, 4],
//                [0, 2, 4, 6, 6, 6, 4, 2, 0],
//                [0, 0, 2, 6, 6, 6, 2, 0, 0]
//            ]
//        };

//        let pieceType = '';
//        if (pieceId.includes('tot')) pieceType = 'tot';
//        else if (pieceId.includes('ma')) pieceType = 'ma';
//        else if (pieceId.includes('xe')) pieceType = 'xe';
//        else if (pieceId.includes('phao')) pieceType = 'phao';
//        else if (pieceId.includes('si')) pieceType = 'si';
//        else if (pieceId.includes('tuong') && !pieceId.includes('chutuong')) pieceType = 'tuong';
//        else if (pieceId.includes('chutuong')) pieceType = 'chutuong';

//        const color = pieceId.includes('do') ? 'do' : 'den';
//        const key = `${pieceType}${color}`;

//        if (positionValues[key]) {
//            return positionValues[key][i][j];
//        }
//        return 0;
//    }

//    generateMoves(matrix, player) {
//        const moves = [];
//        for (let i = 0; i < matrix.length; i++) {
//            for (let j = 0; j < matrix[i].length; j++) {
//                const piece = matrix[i][j];
//                if (piece.id && piece.id.includes(player)) {
//                    const pieceMoves = this.getValidMovesForPiece(matrix, i, j);
//                    const formattedMoves = pieceMoves.map(move => ({
//                        from: { i: move.from.row, j: move.from.col, id: piece.id },
//                        to: { i: move.to.row, j: move.to.col, id: "" }
//                    }));
//                    moves.push(...formattedMoves);
//                }
//            }
//        }
//        return moves;
//    }



//    getValidMovesForPiece(matrix, i, j) {
//        const piece = matrix[i][j];
//        const moves = [];

//        if (!piece || !piece.id) return moves;

//        const color = piece.id.includes('do') ? 'do' : 'den';
//        const pieceType = this.getPieceType(piece.id);

//        switch (pieceType) {
//            case 'tot':
//                moves.push(...this.getTotMoves(matrix, i, j, color));
//                break;
//            case 'ma':
//                moves.push(...this.getMaMoves(matrix, i, j, color));
//                break;
//            case 'xe':
//                moves.push(...this.getXeMoves(matrix, i, j, color));
//                break;
//            case 'phao':
//                moves.push(...this.getPhaoMoves(matrix, i, j, color));
//                break;
//            case 'tuong':
//                moves.push(...this.getTuongMoves(matrix, i, j, color));
//                break;
//            case 'si':
//                moves.push(...this.getSiMoves(matrix, i, j, color));
//                break;
//            case 'chutuong':
//                moves.push(...this.getChuTuongMoves(matrix, i, j, color));
//                break;
//        }

//        // Lọc bỏ các nước đi không hợp lệ hoặc tự ăn quân mình
//        return moves.filter(move => this.isValidDestination(matrix, move.to.row, move.to.col, color));
//    }

//    getPieceType(pieceId) {
//        if (pieceId.includes('chutuong')) return 'chutuong';
//        if (pieceId.includes('tuong')) return 'tuong';
//        if (pieceId.includes('si')) return 'si';
//        if (pieceId.includes('ma')) return 'ma';
//        if (pieceId.includes('xe')) return 'xe';
//        if (pieceId.includes('phao')) return 'phao';
//        if (pieceId.includes('tot')) return 'tot';
//        return '';
//    }

//    getTotMoves(matrix, i, j, color) {
//        const moves = [];
//        const direction = color === 'do' ? -1 : 1; // Hướng di chuyển (lên/xuống)

//        // Kiểm tra đã qua sông chưa
//        const crossedRiver = color === 'do' ? i < 5 : i > 4;

//        // Di chuyển thẳng
//        const forwardRow = i + direction;
//        if (this.isInBoard(forwardRow, j)) {
//            moves.push({ from: { row: i, col: j }, to: { row: forwardRow, col: j } });
//        }

//        // Nếu đã qua sông, thêm nước đi ngang
//        if (crossedRiver) {
//            // Di chuyển sang trái
//            if (this.isInBoard(i, j - 1)) {
//                moves.push({ from: { row: i, col: j }, to: { row: i, col: j - 1 } });
//            }
//            // Di chuyển sang phải
//            if (this.isInBoard(i, j + 1)) {
//                moves.push({ from: { row: i, col: j }, to: { row: i, col: j + 1 } });
//            }
//        }

//        return moves;
//    }

//    getMaMoves(matrix, i, j, color) {
//        const moves = [];
//        const maMoves = [
//            { row: -2, col: -1 }, { row: -2, col: 1 },
//            { row: 2, col: -1 }, { row: 2, col: 1 },
//            { row: -1, col: -2 }, { row: -1, col: 2 },
//            { row: 1, col: -2 }, { row: 1, col: 2 }
//        ];

//        for (const move of maMoves) {
//            const newRow = i + move.row;
//            const newCol = j + move.col;

//            // Kiểm tra điểm đến có hợp lệ
//            if (!this.isInBoard(newRow, newCol)) continue;

//            // Kiểm tra chặn mã
//            const blockRow = i + Math.sign(move.row);
//            const blockCol = j + Math.sign(move.col);
//            if (matrix[blockRow][blockCol].id) continue; // Bị chặn

//            moves.push({ from: { row: i, col: j }, to: { row: newRow, col: newCol } });
//        }

//        return moves;
//    }

//    getXeMoves(matrix, i, j, color) {
//        const moves = [];
//        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 4 hướng

//        for (const [dx, dy] of directions) {
//            let newRow = i + dx;
//            let newCol = j + dy;

//            while (this.isInBoard(newRow, newCol)) {
//                if (matrix[newRow][newCol].id) {
//                    // Nếu gặp quân cờ, thêm nước ăn quân (nếu là quân địch) và dừng
//                    if (!matrix[newRow][newCol].id.includes(color)) {
//                        moves.push({ from: { row: i, col: j }, to: { row: newRow, col: newCol } });
//                    }
//                    break;
//                }

//                moves.push({ from: { row: i, col: j }, to: { row: newRow, col: newCol } });
//                newRow += dx;
//                newCol += dy;
//            }
//        }

//        return moves;
//    }

//    getPhaoMoves(matrix, i, j, color) {
//        const moves = [];
//        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

//        for (const [dx, dy] of directions) {
//            let newRow = i + dx;
//            let newCol = j + dy;
//            let foundPlatform = false; // Đã tìm thấy quân làm bệ phóng chưa

//            while (this.isInBoard(newRow, newCol)) {
//                if (matrix[newRow][newCol].id) {
//                    if (!foundPlatform) {
//                        // Đây là quân đầu tiên gặp phải - làm bệ phóng
//                        foundPlatform = true;
//                    } else {
//                        // Đây là quân thứ hai - có thể ăn nếu là quân địch
//                        if (!matrix[newRow][newCol].id.includes(color)) {
//                            moves.push({ from: { row: i, col: j }, to: { row: newRow, col: newCol } });
//                        }
//                        break;
//                    }
//                } else if (!foundPlatform) {
//                    // Thêm nước đi bình thường khi chưa gặp bệ phóng
//                    moves.push({ from: { row: i, col: j }, to: { row: newRow, col: newCol } });
//                }

//                newRow += dx;
//                newCol += dy;
//            }
//        }

//        return moves;
//    }

//    getTuongMoves(matrix, i, j, color) {
//        const moves = [];
//        const tuongMoves = [
//            { row: -2, col: -2 }, { row: -2, col: 2 },
//            { row: 2, col: -2 }, { row: 2, col: 2 }
//        ];

//        for (const move of tuongMoves) {
//            const newRow = i + move.row;
//            const newCol = j + move.col;

//            // Kiểm tra giới hạn sông
//            if (color === 'do' && newRow < 5) continue;
//            if (color === 'den' && newRow > 4) continue;

//            if (!this.isInBoard(newRow, newCol)) continue;

//            // Kiểm tra chặn tượng
//            const blockRow = i + move.row / 2;
//            const blockCol = j + move.col / 2;
//            if (matrix[blockRow][blockCol].id) continue;

//            moves.push({ from: { row: i, col: j }, to: { row: newRow, col: newCol } });
//        }

//        return moves;
//    }

//    getSiMoves(matrix, i, j, color) {
//        const moves = [];
//        const siMoves = [
//            { row: -1, col: -1 }, { row: -1, col: 1 },
//            { row: 1, col: -1 }, { row: 1, col: 1 }
//        ];

//        for (const move of siMoves) {
//            const newRow = i + move.row;
//            const newCol = j + move.col;

//            // Kiểm tra trong cung
//            if (!this.isInPalace(newRow, newCol, color)) continue;

//            if (this.isInBoard(newRow, newCol)) {
//                moves.push({ from: { row: i, col: j }, to: { row: newRow, col: newCol } });
//            }
//        }

//        return moves;
//    }

//    getChuTuongMoves(matrix, i, j, color) {
//        const moves = [];
//        const tuongMoves = [
//            { row: -1, col: 0 }, { row: 1, col: 0 },
//            { row: 0, col: -1 }, { row: 0, col: 1 }
//        ];

//        for (const move of tuongMoves) {
//            const newRow = i + move.row;
//            const newCol = j + move.col;

//            // Kiểm tra trong cung
//            if (!this.isInPalace(newRow, newCol, color)) continue;

//            if (this.isInBoard(newRow, newCol)) {
//                moves.push({ from: { row: i, col: j }, to: { row: newRow, col: newCol } });
//            }
//        }

//        // Kiểm tra luật tướng đối diện
//        const oppositeKing = this.findOppositeKing(matrix, i, j, color);
//        if (oppositeKing && oppositeKing.col === j) {
//            let hasBlockingPiece = false;
//            const startRow = Math.min(i, oppositeKing.row);
//            const endRow = Math.max(i, oppositeKing.row);

//            for (let row = startRow + 1; row < endRow; row++) {
//                if (matrix[row][j].id) {
//                    hasBlockingPiece = true;
//                    break;
//                }
//            }

//            if (!hasBlockingPiece) {
//                // Không được di chuyển đến vị trí tạo thành tướng đối diện
//                moves.filter(move => move.to.col !== j);
//            }
//        }

//        return moves;
//    }

//    findOppositeKing(matrix, i, currentCol, color) {
//        const oppositeColor = color === 'do' ? 'den' : 'do';
//        for (let i = 0; i < matrix.length; i++) {
//            if (matrix[i][currentCol].id &&
//                matrix[i][currentCol].id.includes('chutuong') &&
//                matrix[i][currentCol].id.includes(oppositeColor)) {
//                return { row: i, col: currentCol };
//            }
//        }
//        return null;
//    }

//    isInBoard(i, j) {
//        return i >= 0 && i < 10 && j >= 0 && j < 9;
//    }

//    isInPalace(i, j, color) {
//        if (color === 'do') {
//            return i >= 7 && i <= 9 && j >= 3 && j <= 5;
//        } else {
//            return i >= 0 && i <= 2 && j >= 3 && j <= 5;
//        }
//    }

//    isValidDestination(matrix, i, j, color) {
//        return this.isInBoard(i, j) &&
//            (!matrix[i][j].id || !matrix[i][j].id.includes(color));
//    }

//    // Đánh giá mức độ bảo vệ quân
//    evaluateProtection(matrix) {
//        let score = 0;
//        for (let i = 0; i < matrix.length; i++) {
//            for (let j = 0; j < matrix[i].length; j++) {
//                const piece = matrix[i][j];
//                if (piece.id) {
//                    const isRed = piece.id.includes('do');
//                    const protectors = this.countProtectors(matrix, i, j);
//                    const protectionValue = protectors * 10; // Mỗi quân bảo vệ tăng 10 điểm

//                    if (isRed) {
//                        score += protectionValue;
//                    } else {
//                        score -= protectionValue;
//                    }
//                }
//            }
//        }
//        return score;
//    }

//    // Đếm số quân đang bảo vệ một vị trí
//    countProtectors(matrix, row, col) {
//        const piece = matrix[row][col];
//        if (!piece.id) return 0;

//        const color = piece.id.includes('do') ? 'do' : 'den';
//        let protectors = 0;

//        // Kiểm tra tất cả các quân cùng màu có thể di chuyển đến vị trí này
//        for (let i = 0; i < matrix.length; i++) {
//            for (let j = 0; j < matrix[i].length; j++) {
//                const protector = matrix[i][j];
//                if (protector.id && protector.id.includes(color) &&
//                    this.canPieceReach(matrix, i, j, row, col)) {
//                    protectors++;
//                }
//            }
//        }

//        return protectors;
//    }

//    // Kiểm tra một quân có thể đi đến vị trí đích không
//    canPieceReach(matrix, fromRow, fromCol, toRow, toCol) {
//        const moves = this.getValidMovesForPiece(matrix, fromRow, fromCol);
//        return moves.some(move =>
//            move.to.row === toRow && move.to.col === toCol
//        );
//    }

//    // Đánh giá khả năng tấn công
//    evaluateAttacks(matrix) {
//        let score = 0;
//        const moves = this.generateMoves(matrix, this.currentPlayer);

//        for (const move of moves) {
//            const targetPiece = matrix[move.to.row][move.to.col];
//            if (targetPiece.id) {
//                // Tính điểm cho khả năng ăn quân
//                const captureValue = this.getPieceValue(targetPiece.id) * 0.1;
//                score += captureValue;
//            }
//        }

//        return score;
//    }

//    // Đánh giá khả năng di chuyển
//    evaluateMobility(matrix) {
//        let redMobility = this.generateMoves(matrix, 'do').length;
//        let blackMobility = this.generateMoves(matrix, 'den').length;
//        return (redMobility - blackMobility) * 0.1;
//    }

//    // Đánh giá mức độ đe dọa tướng
//    evaluateKingThreat(matrix) {
//        let score = 0;

//        // Tìm vị trí hai tướng
//        let redKing = this.findKing(matrix, 'do');
//        let blackKing = this.findKing(matrix, 'den');

//        if (!redKing || !blackKing) return 0;

//        // Đánh giá số quân đang tấn công mỗi tướng
//        const redThreats = this.countThreatsToKing(matrix, redKing.row, redKing.col, 'den');
//        const blackThreats = this.countThreatsToKing(matrix, blackKing.row, blackKing.col, 'do');

//        score += (blackThreats - redThreats) * 50;

//        // Đánh giá khoảng cách giữa hai tướng
//        const kingDistance = Math.abs(redKing.row - blackKing.row) +
//            Math.abs(redKing.col - blackKing.col);
//        score += (14 - kingDistance) * 10;

//        return score;
//    }

//    // Tìm vị trí tướng
//    findKing(matrix, color) {
//        for (let i = 0; i < matrix.length; i++) {
//            for (let j = 0; j < matrix[i].length; j++) {
//                const piece = matrix[i][j];
//                if (piece.id && piece.id.includes('chutuong') &&
//                    piece.id.includes(color)) {
//                    return { row: i, col: j };
//                }
//            }
//        }
//        return null;
//    }

//    // Đếm số quân đang đe dọa tướng
//    countThreatsToKing(matrix, kingRow, kingCol, attackerColor) {
//        let threats = 0;
//        for (let i = 0; i < matrix.length; i++) {
//            for (let j = 0; j < matrix[i].length; j++) {
//                const piece = matrix[i][j];
//                if (piece.id && piece.id.includes(attackerColor)) {
//                    if (this.canPieceReach(matrix, i, j, kingRow, kingCol)) {
//                        threats++;
//                    }
//                }
//            }
//        }
//        return threats;
//    }


//    // Thuật toán minimax với alpha-beta pruning
//    minimax(matrix, depth, alpha, beta, maximizingPlayer) {
//        // Base case - đạt đến độ sâu tối đa
//        if (depth === 0) {
//            return this.evaluateBoard(matrix);
//        }

//        if (maximizingPlayer) {
//            let maxScore = -Infinity;
//            const moves = this.generateMoves(matrix, this.currentPlayer);

//            for (const move of moves) {
//                const newMatrix = this.makeMove(matrix, move);
//                const score = this.minimax(newMatrix, depth - 1, alpha, beta, false);
//                maxScore = Math.max(maxScore, score);
//                alpha = Math.max(alpha, score);

//                // Alpha-beta pruning
//                if (beta <= alpha) {
//                    break;
//                }
//            }
//            return maxScore;
//        } else {
//            let minScore = Infinity;
//            const moves = this.generateMoves(matrix,
//                this.currentPlayer === 'do' ? 'den' : 'do');

//            for (const move of moves) {
//                const newMatrix = this.makeMove(matrix, move);
//                const score = this.minimax(newMatrix, depth - 1, alpha, beta, true);
//                minScore = Math.min(minScore, score);
//                beta = Math.min(beta, score);

//                // Alpha-beta pruning
//                if (beta <= alpha) {
//                    break;
//                }
//            }
//            return minScore;
//        }
//    }

//    // Thực hiện nước đi trên bàn cờ
//    makeMove(matrix, move) {
//        const newMatrix = JSON.parse(JSON.stringify(matrix));
//        // Sử dụng định dạng {i, j} thay vì {row, col}
//        newMatrix[move.to.i][move.to.j] = newMatrix[move.from.i][move.from.j];
//        newMatrix[move.from.i][move.from.j] = { id: "" };
//        return newMatrix;
//    }

//    // Chọn nước đi tốt nhất
//    getBestMove(matrix) {
//        let bestMove = null;
//        let bestValue = -Infinity;
//        const moves = this.generateMoves(matrix, this.currentPlayer);

//        // Sắp xếp các nước đi theo ưu tiên
//        moves.sort((a, b) => {
//            const scoreA = this.getMoveScore(matrix, {
//                from: { row: a.from.i, col: a.from.j },
//                to: { row: a.to.i, col: a.to.j }
//            });
//            const scoreB = this.getMoveScore(matrix, {
//                from: { row: b.from.i, col: b.from.j },
//                to: { row: b.to.i, col: b.to.j }
//            });
//            return scoreB - scoreA;
//        });

//        for (const move of moves) {
//            const newMatrix = this.makeMove(matrix, move);
//            const value = this.minimax(newMatrix, this.depth - 1, -Infinity, Infinity, false);

//            if (value > bestValue) {
//                bestValue = value;
//                bestMove = move;
//            }
//        }

//        // Trả về nước đi với định dạng server yêu cầu
//        return bestMove ? {
//            from: bestMove.from,
//            to: bestMove.to
//        } : null;
//    }
//    // Đánh giá nhanh giá trị của một nước đi
//    getMoveScore(matrix, move) {
//        let score = 0;
//        const piece = matrix[move.from.row][move.from.col];
//        const target = matrix[move.to.row][move.to.col];

//        // Ưu tiên ăn quân
//        if (target.id) {
//            score += this.getPieceValue(target.id) * 10;
//        }

//        // Ưu tiên bảo vệ quân quan trọng
//        const protectors = this.countProtectors(matrix, move.to.row, move.to.col);
//        score += protectors * 5;

//        // Ưu tiên di chuyển đến vị trí tốt
//        score += this.getPositionValue(piece.id, move.to.row, move.to.col);

//        return score;
//    }
//     // Thêm phương thức để khởi tạo AI và lấy nước đi
//    static getNextMove(matrix, player = 'do', depth = 3) {
//        const ai = new ChessAI(depth);
//        ai.currentPlayer = player;
//        return ai.getBestMove(matrix);
//    }
//}
