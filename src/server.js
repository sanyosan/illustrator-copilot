const ImageMonitor = require('./imageMonitor');
const PersonImageProcessor = require('./personImageProcessor');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

class CopilotServer {
    constructor(config = {}) {
        this.config = {
            port: config.port || 3000,
            ...config
        };
        
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        
        this.imageMonitor = new ImageMonitor();
        this.personProcessor = new PersonImageProcessor();
        
        this.setupServer();
        this.setupImageMonitorEvents();
        this.setupPersonProcessorEvents();
    }
    
    setupServer() {
        // 静的ファイルの提供
        this.app.use(express.static('public'));
        this.app.use('/output', express.static('output'));
        
        // API エンドポイント
        this.app.get('/api/status', (req, res) => {
            res.json(this.imageMonitor.getStatus());
        });
        
        this.app.get('/api/results', (req, res) => {
            const results = {};
            for (const [key, value] of this.imageMonitor.results) {
                results[key] = {
                    ...value,
                    image: undefined // 画像オブジェクトを除外
                };
            }
            res.json(results);
        });
        
        // 新しいAPI エンドポイント
        this.app.get('/api/person-status', async (req, res) => {
            const status = await this.personProcessor.getProcessingStatus();
            res.json(status);
        });
        
        this.app.post('/api/process-images', async (req, res) => {
            try {
                this.io.emit('processingStarted');
                const results = await this.personProcessor.processAllImages();
                res.json({ success: true, results });
                this.io.emit('processingComplete', results);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
                this.io.emit('processingError', error.message);
            }
        });
        
        // メインページ
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });
        
        // Socket.IO接続
        this.io.on('connection', (socket) => {
            console.log('🔌 Client connected:', socket.id);
            
            // 現在の状態を送信
            socket.emit('status', this.imageMonitor.getStatus());
            
            socket.on('disconnect', () => {
                console.log('🔌 Client disconnected:', socket.id);
            });
            
            socket.on('requestStatus', () => {
                socket.emit('status', this.imageMonitor.getStatus());
            });
        });
    }
    
    setupImageMonitorEvents() {
        this.imageMonitor.on('fileChanged', (data) => {
            console.log('📡 Broadcasting file change:', data.fileName);
            this.io.emit('fileChanged', data);
        });
        
        this.imageMonitor.on('comparisonComplete', (data) => {
            console.log('📡 Broadcasting comparison results');
            this.io.emit('comparisonComplete', {
                results: this.convertResultsForBroadcast(data.results),
                timestamp: data.timestamp
            });
        });
    }
    
    setupPersonProcessorEvents() {
        this.personProcessor.on('imageProcessed', (data) => {
            console.log('📡 Broadcasting image processing progress:', data.file);
            this.io.emit('imageProcessed', data);
        });
    }
    
    convertResultsForBroadcast(results) {
        const broadcastResults = {};
        for (const [key, value] of results) {
            broadcastResults[key] = {
                ...value,
                image: undefined // 画像オブジェクトを除外
            };
        }
        return broadcastResults;
    }
    
    start() {
        this.server.listen(this.config.port, () => {
            console.log('🚀 Illustrator Copilot Server started');
            console.log(`🌐 Web interface: http://localhost:${this.config.port}`);
            console.log(`📊 API endpoint: http://localhost:${this.config.port}/api/status`);
            console.log('📁 Place your images in:');
            console.log('   - Original images: ./data/original/');
            console.log('   - Target images: ./data/target/');
            console.log('   - Results will be saved to: ./output/');
        });
    }
}

module.exports = CopilotServer;
