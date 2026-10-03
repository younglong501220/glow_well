import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { AudioEngine } from '../game/audio';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TILE_SIZE,
  COLS,
  ROWS,
  INITIAL_ROOMS,
  INITIAL_BLOCKS,
  ROOM_NAMES,
  WELL_CREATURES,
  WEATHER_CONFIGS,
  ACHIEVEMENT_DEFINITIONS,
} from '../game/constants';
import {
  Player,
  Bubble,
  Particle,
  Firefly,
  RoomCoord,
  TileType,
  PushBlock,
  SaveGameData,
  WeatherType,
  WeatherParticle,
} from '../game/types';
import { SaveManager } from '../game/saveManager';

export interface GlowWellGameHandle {
  saveGame: () => boolean;
  loadGame: () => boolean;
  hasSave: () => boolean;
  resetGame: () => void;
}

interface GlowWellGameProps {
  crtEnabled: boolean;
  onStatsUpdate: (stats: {
    eggs: number;
    totalEggs: number;
    roomKey: string;
    roomName: string;
    switchPressed: boolean;
    pressurePlatformActive: boolean;
    visitedRooms: string[];
    discoveredCreatures: string[];
    totalCreatures: number;
    unlockedAchievements: string[];
    totalAchievements: number;
    currentWeather: WeatherType;
    isCompleted: boolean;
    timerSeconds: number;
    hasSaveFile: boolean;
  }) => void;
  onWinTriggered: (elapsedTime: number) => void;
  onNotification?: (msg: string) => void;
  onAchievementUnlocked?: (achievement: {
    id: string;
    title: string;
    description: string;
    icon: string;
  }) => void;
}

export const GlowWellGame = forwardRef<GlowWellGameHandle, GlowWellGameProps>(
  (
    {
      crtEnabled,
      onStatsUpdate,
      onWinTriggered,
      onNotification,
      onAchievementUnlocked,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Game Core States
    const mapDataRef = useRef<Record<string, TileType[][]>>(
      JSON.parse(JSON.stringify(INITIAL_ROOMS))
    );
    const blocksRef = useRef<PushBlock[]>(
      JSON.parse(JSON.stringify(INITIAL_BLOCKS))
    );
    const currentRoomRef = useRef<RoomCoord>({ x: 0, y: 1 });
    const switchPressedRef = useRef<boolean>(false);
    const pressurePlatformActiveRef = useRef<boolean>(false);
    const eggsCollectedRef = useRef<number>(0);
    const visitedRoomsRef = useRef<Set<string>>(new Set(['0,1']));
    const isCompletedRef = useRef<boolean>(false);
    const startTimeRef = useRef<number>(Date.now());
    const timerSecondsRef = useRef<number>(0);
    const bubbleJumpCountRef = useRef<number>(0);

    // Achievements & Creatures tracking
    const unlockedAchievementsRef = useRef<Set<string>>(new Set());
    const discoveredCreaturesRef = useRef<Set<string>>(new Set());

    // Weather & Atmosphere System
    const currentWeatherRef = useRef<WeatherType>('CALM');
    const weatherTimerRef = useRef<number>(1200);
    const weatherParticlesRef = useRef<WeatherParticle[]>([]);

    // Environmental sound cooldowns
    const footstepCooldownRef = useRef<number>(0);
    const waterRippleCooldownRef = useRef<number>(0);
    const wallScrapeCooldownRef = useRef<number>(0);

    // Toast banner state in canvas
    const toastRef = useRef<{ text: string; timer: number } | null>(null);
    const telephoneCooldownRef = useRef<number>(0);

    // Player state
    const playerRef = useRef<Player>({
      x: 60,
      y: 175,
      w: 14,
      h: 14,
      vx: 0,
      vy: 0,
      speed: 2.3,
      jumpPower: -5.9,
      grounded: false,
      facing: 1,
      isBlinking: false,
      blinkTimer: 100,
      squishX: 1,
      squishY: 1,
    });

    const bubblesRef = useRef<Bubble[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const firefliesRef = useRef<Firefly[]>([]);
    const keysRef = useRef<Record<string, boolean>>({});
    const nextBubbleIdRef = useRef<number>(1);
    const pushSoundCooldownRef = useRef<number>(0);

    // Mobile touch buttons states
    const [touchActive, setTouchActive] = useState<{
      left: boolean;
      right: boolean;
      jump: boolean;
      bubble: boolean;
    }>({
      left: false,
      right: false,
      jump: false,
      bubble: false,
    });

    const showToast = useCallback((msg: string) => {
      toastRef.current = { text: msg, timer: 180 };
      if (onNotification) onNotification(msg);
    }, [onNotification]);

    const spawnPoof = useCallback(
      (x: number, y: number, color: string, count = 7, sizeMultiplier = 1) => {
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2.2 + 0.4;
          particlesRef.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color,
            life: 20 + Math.floor(Math.random() * 12),
            maxLife: 32,
            size: (Math.random() * 2.5 + 1.2) * sizeMultiplier,
          });
        }
      },
      []
    );

    // Unlock an achievement and trigger toast + audio
    const unlockAchievement = useCallback(
      (id: string) => {
        if (!unlockedAchievementsRef.current.has(id)) {
          unlockedAchievementsRef.current.add(id);
          AudioEngine.playAchievement();
          const def = ACHIEVEMENT_DEFINITIONS[id];
          if (def) {
            if (onAchievementUnlocked) {
              onAchievementUnlocked(def);
            }
            showToast(`🏆 成就達成：【${def.title}】！`);
            spawnPoof(
              playerRef.current.x + 7,
              playerRef.current.y + 7,
              '#ffd447',
              18,
              1.3
            );
          }
        }
      },
      [onAchievementUnlocked, showToast, spawnPoof]
    );

    // Init fireflies
    useEffect(() => {
      firefliesRef.current = Array.from({ length: 32 }, () => ({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.8 + 0.2,
        hue: Math.random() > 0.3 ? 155 : 185,
        pulseSpeed: 0.03 + Math.random() * 0.04,
      }));
    }, []);

    const getTile = useCallback(
      (rx: number, ry: number, col: number, row: number): TileType => {
        const key = `${rx},${ry}`;
        const room = mapDataRef.current[key];
        if (!room) return 1;
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return 0;
        return room[row][col];
      },
      []
    );

    const setTile = useCallback(
      (rx: number, ry: number, col: number, row: number, val: TileType) => {
        const key = `${rx},${ry}`;
        if (mapDataRef.current[key]) {
          mapDataRef.current[key][row][col] = val;
        }
      },
      []
    );

    const isSolid = useCallback(
      (tileVal: TileType): boolean => {
        if (tileVal === 1) return true;
        if (tileVal === 8) return true;
        if (tileVal === 3 && !switchPressedRef.current) return true;
        if (tileVal === 11 && !pressurePlatformActiveRef.current) return true;
        return false;
      },
      []
    );

    // Destroy brittle cracked wall (Tile 8)
    const breakCrackedWall = useCallback(
      (rx: number, ry: number, col: number, row: number) => {
        setTile(rx, ry, col, row, 0);
        AudioEngine.playBreak();
        const wx = col * TILE_SIZE + TILE_SIZE / 2;
        const wy = row * TILE_SIZE + TILE_SIZE / 2;
        spawnPoof(wx, wy, '#1b443a', 14, 1.8);
        spawnPoof(wx, wy, '#ffd447', 8, 1.2);
        showToast('碎石崩塌 · 隱秘石窟已揭曉！');
        unlockAchievement('wall_breaker');
      },
      [setTile, spawnPoof, showToast, unlockAchievement]
    );

    const spawnBubble = useCallback(() => {
      AudioEngine.init();
      const p = playerRef.current;
      if (bubblesRef.current.length >= 2) {
        const oldest = bubblesRef.current.shift();
        if (oldest) {
          spawnPoof(oldest.x, oldest.y, '#5cf2bd', 6);
        }
      }

      const bx = p.x + (p.facing > 0 ? p.w + 5 : -14);
      const by = p.y - 1;

      bubblesRef.current.push({
        id: nextBubbleIdRef.current++,
        x: bx,
        y: by,
        r: 10.5,
        vy: -0.36,
        vx: p.facing * 0.4,
        life: 320,
        maxLife: 320,
        wobblePhase: Math.random() * Math.PI * 2,
      });

      p.squishX = 1.2;
      p.squishY = 0.85;

      AudioEngine.playBubble();
    }, [spawnPoof]);

    // Save Game state to LocalStorage
    const saveGame = useCallback((): boolean => {
      const saveData: SaveGameData = {
        version: 1,
        savedAt: Date.now(),
        player: {
          x: playerRef.current.x,
          y: playerRef.current.y,
          facing: playerRef.current.facing,
        },
        currentRoom: {
          x: currentRoomRef.current.x,
          y: currentRoomRef.current.y,
        },
        mapData: mapDataRef.current,
        blocks: blocksRef.current,
        switchPressed: switchPressedRef.current,
        pressurePlatformActive: pressurePlatformActiveRef.current,
        eggsCollected: eggsCollectedRef.current,
        discoveredCreatures: Array.from(discoveredCreaturesRef.current),
        unlockedAchievements: Array.from(unlockedAchievementsRef.current),
        visitedRooms: Array.from(visitedRoomsRef.current),
        timerSeconds: timerSecondsRef.current,
        isCompleted: isCompletedRef.current,
      };

      const success = SaveManager.save(saveData);
      if (success) {
        AudioEngine.playSave();
        showToast('★ 冒險進度已儲存！');
        spawnPoof(playerRef.current.x + 7, playerRef.current.y + 7, '#5cffd2', 15);
      }
      return success;
    }, [showToast, spawnPoof]);

    // Load Game state from LocalStorage
    const loadGame = useCallback((): boolean => {
      const data = SaveManager.load();
      if (!data) {
        showToast('找不到已儲存的冒險記錄');
        return false;
      }

      mapDataRef.current = data.mapData;
      blocksRef.current = data.blocks || JSON.parse(JSON.stringify(INITIAL_BLOCKS));
      currentRoomRef.current = data.currentRoom;
      switchPressedRef.current = data.switchPressed;
      pressurePlatformActiveRef.current = data.pressurePlatformActive || false;
      eggsCollectedRef.current = data.eggsCollected;
      discoveredCreaturesRef.current = new Set(data.discoveredCreatures || []);
      unlockedAchievementsRef.current = new Set(data.unlockedAchievements || []);
      visitedRoomsRef.current = new Set(data.visitedRooms);
      timerSecondsRef.current = data.timerSeconds;
      startTimeRef.current = Date.now() - data.timerSeconds * 1000;
      isCompletedRef.current = data.isCompleted;

      playerRef.current.x = data.player.x;
      playerRef.current.y = data.player.y;
      playerRef.current.facing = data.player.facing;
      playerRef.current.vx = 0;
      playerRef.current.vy = 0;

      bubblesRef.current = [];
      particlesRef.current = [];

      AudioEngine.playSave();
      showToast('★ 冒險進度讀取成功！');
      spawnPoof(data.player.x + 7, data.player.y + 7, '#63fed0', 20);
      return true;
    }, [showToast, spawnPoof]);

    // Restart / Reset game
    const resetGame = useCallback(() => {
      mapDataRef.current = JSON.parse(JSON.stringify(INITIAL_ROOMS));
      blocksRef.current = JSON.parse(JSON.stringify(INITIAL_BLOCKS));
      currentRoomRef.current = { x: 0, y: 1 };
      switchPressedRef.current = false;
      pressurePlatformActiveRef.current = false;
      eggsCollectedRef.current = 0;
      discoveredCreaturesRef.current = new Set();
      unlockedAchievementsRef.current = new Set();
      visitedRoomsRef.current = new Set(['0,1']);
      isCompletedRef.current = false;
      startTimeRef.current = Date.now();
      timerSecondsRef.current = 0;
      bubbleJumpCountRef.current = 0;

      playerRef.current = {
        x: 60,
        y: 175,
        w: 14,
        h: 14,
        vx: 0,
        vy: 0,
        speed: 2.3,
        jumpPower: -5.9,
        grounded: false,
        facing: 1,
        isBlinking: false,
        blinkTimer: 100,
        squishX: 1,
        squishY: 1,
      };
      bubblesRef.current = [];
      particlesRef.current = [];
      spawnPoof(67, 182, '#5cffd2', 14);
      showToast('幽井已重置');
    }, [spawnPoof, showToast]);

    // Expose methods via forwardRef
    useImperativeHandle(
      ref,
      () => ({
        saveGame,
        loadGame,
        hasSave: () => SaveManager.hasSave(),
        resetGame,
      }),
      [saveGame, loadGame, resetGame]
    );

    // Keyboard events
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }

        AudioEngine.init();
        const key = e.key.toLowerCase();
        keysRef.current[key] = true;
        keysRef.current[e.code] = true;

        if (key === 'j' || key === 'z' || key === 'k') {
          spawnBubble();
        }
        if (key === 's') {
          saveGame();
        }
        if (key === 'l') {
          loadGame();
        }
        if (key === 'r') {
          resetGame();
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        keysRef.current[key] = false;
        keysRef.current[e.code] = false;
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, [spawnBubble, saveGame, loadGame, resetGame]);

    // Main Game Loop
    useEffect(() => {
      let animId: number;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const lightCanvas = document.createElement('canvas');
      lightCanvas.width = CANVAS_WIDTH;
      lightCanvas.height = CANVAS_HEIGHT;
      const lightCtx = lightCanvas.getContext('2d');

      const weatherCycle: WeatherType[] = [
        'CALM',
        'WATER_DROPLETS',
        'GLOWING_DUST',
        'FIREFLY_SWARM',
      ];

      const updatePhysics = () => {
        const p = playerRef.current;
        const curRoom = currentRoomRef.current;
        const roomKey = `${curRoom.x},${curRoom.y}`;
        const map = mapDataRef.current[roomKey] || [];

        if (telephoneCooldownRef.current > 0) {
          telephoneCooldownRef.current--;
        }
        if (pushSoundCooldownRef.current > 0) {
          pushSoundCooldownRef.current--;
        }
        if (wallScrapeCooldownRef.current > 0) {
          wallScrapeCooldownRef.current--;
        }

        // Keep AudioEngine scene room acoustics synchronized
        AudioEngine.setSceneRoom(roomKey);

        // --- SUBTLE WEATHER ATMOSPHERE CYCLE ---
        weatherTimerRef.current--;
        if (weatherTimerRef.current <= 0) {
          weatherTimerRef.current = 1500;
          const currentIndex = weatherCycle.indexOf(currentWeatherRef.current);
          const nextWeather =
            weatherCycle[(currentIndex + 1) % weatherCycle.length];
          currentWeatherRef.current = nextWeather;
          showToast(WEATHER_CONFIGS[nextWeather].toastMsg);
          unlockAchievement('weather_witness');
        }

        // Generate weather particles
        const weather = currentWeatherRef.current;
        if (weather === 'WATER_DROPLETS') {
          if (Math.random() < 0.32) {
            weatherParticlesRef.current.push({
              x: Math.random() * CANVAS_WIDTH,
              y: 0,
              vx: (Math.random() - 0.5) * 0.2,
              vy: 3.4 + Math.random() * 1.2,
              size: 2,
              color: '#65e3ff',
              alpha: 0.8,
              life: 80,
              maxLife: 80,
            });
          }
        } else if (weather === 'GLOWING_DUST') {
          if (Math.random() < 0.45) {
            weatherParticlesRef.current.push({
              x: Math.random() * CANVAS_WIDTH,
              y: Math.random() * (CANVAS_HEIGHT * 0.4),
              vx: 0.8 + Math.random() * 0.6,
              vy: 0.35 + Math.random() * 0.4,
              size: 2.2,
              color: Math.random() > 0.4 ? '#ffe066' : '#5cf2bd',
              alpha: 0.9,
              life: 140,
              maxLife: 140,
            });
          }
        }

        // Update weather particles
        for (let i = weatherParticlesRef.current.length - 1; i >= 0; i--) {
          const wp = weatherParticlesRef.current[i];
          wp.x += wp.vx;
          wp.y += wp.vy;
          wp.life--;

          const wpTileX = Math.floor(wp.x / TILE_SIZE);
          const wpTileY = Math.floor(wp.y / TILE_SIZE);
          const hitTile = getTile(curRoom.x, curRoom.y, wpTileX, wpTileY);

          if (isSolid(hitTile) || hitTile === 6) {
            if (weather === 'WATER_DROPLETS') {
              spawnPoof(wp.x, wp.y, '#65e3ff', 3, 0.7);
              if (Math.random() < 0.08) {
                AudioEngine.playSplash();
              }
            }
            weatherParticlesRef.current.splice(i, 1);
            continue;
          }

          if (wp.life <= 0 || wp.x > CANVAS_WIDTH || wp.y > CANVAS_HEIGHT) {
            weatherParticlesRef.current.splice(i, 1);
          }
        }

        // --- PLAYER CONTROLS & PHYSICS ---
        let move = 0;
        if (keysRef.current['a'] || keysRef.current['arrowleft'] || touchActive.left) move -= 1;
        if (keysRef.current['d'] || keysRef.current['arrowright'] || touchActive.right) move += 1;

        p.vx = move * p.speed;
        if (move !== 0) p.facing = move;

        // Rock surface friction footstep sound effect
        if (p.grounded && Math.abs(p.vx) > 0.5) {
          const underTile = getTile(
            curRoom.x,
            curRoom.y,
            Math.floor((p.x + p.w / 2) / TILE_SIZE),
            Math.floor((p.y + p.h) / TILE_SIZE)
          );
          if (underTile !== 6) {
            footstepCooldownRef.current--;
            if (footstepCooldownRef.current <= 0) {
              footstepCooldownRef.current = 15;
              AudioEngine.playFootstepRock(Math.min(1.2, Math.abs(p.vx) / p.speed));
            }
          }
        } else {
          footstepCooldownRef.current = 0;
        }

        const wantsJump =
          keysRef.current['w'] ||
          keysRef.current['arrowup'] ||
          keysRef.current[' '] ||
          keysRef.current['space'] ||
          touchActive.jump;

        if (wantsJump && p.grounded) {
          p.vy = p.jumpPower;
          p.grounded = false;
          p.squishX = 0.8;
          p.squishY = 1.3;
          AudioEngine.playJump();
          spawnPoof(p.x + p.w / 2, p.y + p.h, '#4ae2b0', 5);
        }

        p.vy += 0.285;
        if (p.vy > 7.5) p.vy = 7.5;

        p.squishX += (1 - p.squishX) * 0.18;
        p.squishY += (1 - p.squishY) * 0.18;

        p.blinkTimer--;
        if (p.blinkTimer <= 0) {
          p.isBlinking = !p.isBlinking;
          p.blinkTimer = p.isBlinking ? 8 : 120 + Math.random() * 140;
        }

        // --- PUSHABLE BLOCKS & PRESSURE-SENSITIVE PLATFORM PUZZLE ---
        const roomBlocks = blocksRef.current.filter((b) => b.roomKey === roomKey);

        roomBlocks.forEach((block) => {
          block.vy += 0.3;
          if (block.vy > 7) block.vy = 7;

          block.y += block.vy;
          const bLeft = Math.floor(block.x / TILE_SIZE);
          const bRight = Math.floor((block.x + block.w - 1) / TILE_SIZE);
          const bBottom = Math.floor((block.y + block.h) / TILE_SIZE);

          block.grounded = false;
          for (let c = bLeft; c <= bRight; c++) {
            const tileBelow = getTile(curRoom.x, curRoom.y, c, bBottom);
            if (isSolid(tileBelow)) {
              if (tileBelow === 8 && block.vy > 2.5) {
                breakCrackedWall(curRoom.x, curRoom.y, c, bBottom);
              } else {
                block.y = bBottom * TILE_SIZE - block.h;
                block.vy = 0;
                block.grounded = true;
                break;
              }
            }
          }

          // Check if Block lands on normal floor switch (Tile 4)
          const bCenterCol = Math.floor((block.x + block.w / 2) / TILE_SIZE);
          const bCenterRow = Math.floor((block.y + block.h + 2) / TILE_SIZE);
          if (getTile(curRoom.x, curRoom.y, bCenterCol, bCenterRow) === 4) {
            if (!switchPressedRef.current) {
              switchPressedRef.current = true;
              AudioEngine.playSwitch();
              spawnPoof(bCenterCol * TILE_SIZE + 15, bCenterRow * TILE_SIZE + 15, '#ffe359', 18);
              showToast('★ 機關激活：重石壓下踏板，深閘解除！');
            }
          }

          // Player pushing block horizontally
          const playerTouchesBlockVertically =
            p.y + p.h > block.y + 2 && p.y < block.y + block.h - 2;

          if (playerTouchesBlockVertically) {
            if (p.vx > 0 && p.x + p.w >= block.x && p.x + p.w <= block.x + 8) {
              const nextTileX = Math.floor((block.x + block.w + 2) / TILE_SIZE);
              const blockRow1 = Math.floor(block.y / TILE_SIZE);
              const blockRow2 = Math.floor((block.y + block.h - 1) / TILE_SIZE);
              const canMoveRight =
                !isSolid(getTile(curRoom.x, curRoom.y, nextTileX, blockRow1)) &&
                !isSolid(getTile(curRoom.x, curRoom.y, nextTileX, blockRow2));

              if (canMoveRight) {
                block.x += 1.4;
                p.x = block.x - p.w;
                if (pushSoundCooldownRef.current <= 0) {
                  AudioEngine.playPush();
                  pushSoundCooldownRef.current = 18;
                }
              } else {
                if (
                  getTile(curRoom.x, curRoom.y, nextTileX, blockRow1) === 8 ||
                  getTile(curRoom.x, curRoom.y, nextTileX, blockRow2) === 8
                ) {
                  breakCrackedWall(
                    curRoom.x,
                    curRoom.y,
                    nextTileX,
                    getTile(curRoom.x, curRoom.y, nextTileX, blockRow1) === 8
                      ? blockRow1
                      : blockRow2
                  );
                }
                p.x = block.x - p.w;
              }
            } else if (
              p.vx < 0 &&
              p.x <= block.x + block.w &&
              p.x >= block.x + block.w - 8
            ) {
              const nextTileX = Math.floor((block.x - 2) / TILE_SIZE);
              const blockRow1 = Math.floor(block.y / TILE_SIZE);
              const blockRow2 = Math.floor((block.y + block.h - 1) / TILE_SIZE);
              const canMoveLeft =
                !isSolid(getTile(curRoom.x, curRoom.y, nextTileX, blockRow1)) &&
                !isSolid(getTile(curRoom.x, curRoom.y, nextTileX, blockRow2));

              if (canMoveLeft) {
                block.x -= 1.4;
                p.x = block.x + block.w;
                if (pushSoundCooldownRef.current <= 0) {
                  AudioEngine.playPush();
                  pushSoundCooldownRef.current = 18;
                }
              } else {
                if (
                  getTile(curRoom.x, curRoom.y, nextTileX, blockRow1) === 8 ||
                  getTile(curRoom.x, curRoom.y, nextTileX, blockRow2) === 8
                ) {
                  breakCrackedWall(
                    curRoom.x,
                    curRoom.y,
                    nextTileX,
                    getTile(curRoom.x, curRoom.y, nextTileX, blockRow1) === 8
                      ? blockRow1
                      : blockRow2
                  );
                }
                p.x = block.x + block.w;
              }
            }
          }

          // Player standing on top of Block
          const playerAboveBlock =
            p.x + p.w > block.x + 1 && p.x < block.x + block.w - 1;
          if (
            playerAboveBlock &&
            p.vy >= 0 &&
            p.y + p.h >= block.y &&
            p.y + p.h <= block.y + 10
          ) {
            p.y = block.y - p.h;
            p.vy = 0;
            p.grounded = true;
          }
        });

        // --- CHECK PRESSURE-SENSITIVE PLATFORM (TILE 10) PUZZLE ---
        let isPlatformDepressed = false;
        roomBlocks.forEach((block) => {
          const bCenterCol = Math.floor((block.x + block.w / 2) / TILE_SIZE);
          const bBottomRow = Math.floor((block.y + block.h + 2) / TILE_SIZE);
          if (getTile(curRoom.x, curRoom.y, bCenterCol, bBottomRow) === 10) {
            isPlatformDepressed = true;
          }
        });

        const pCol = Math.floor((p.x + p.w / 2) / TILE_SIZE);
        const pRow = Math.floor((p.y + p.h + 2) / TILE_SIZE);
        const isPlayerOnPlatform = getTile(curRoom.x, curRoom.y, pCol, pRow) === 10;
        const platformActiveState = isPlatformDepressed || isPlayerOnPlatform;

        if (platformActiveState !== pressurePlatformActiveRef.current) {
          pressurePlatformActiveRef.current = platformActiveState;
          if (platformActiveState) {
            AudioEngine.playPlatformDepress();
            AudioEngine.playPathUnlock();
            showToast(
              isPlatformDepressed
                ? '⚙ 重石卡入感應石臺 · 隱藏通道石柱下沉開通！'
                : '⚙ 踏上感應石臺：石柱下沉（需推動重石常駐壓制）'
            );
            if (isPlatformDepressed) {
              unlockAchievement('platform_engineer');
            }
            for (let r = 0; r < ROWS; r++) {
              for (let c = 0; c < COLS; c++) {
                if (getTile(curRoom.x, curRoom.y, c, r) === 11) {
                  spawnPoof(c * TILE_SIZE + 15, r * TILE_SIZE + 15, '#4be8b4', 10, 1.3);
                }
              }
            }
          } else {
            AudioEngine.playPlatformDepress();
            showToast('⚙ 感應石臺彈起 · 隱藏石柱升起復位！');
          }
        }

        // Player Horizontal Collision
        p.x += p.vx;
        let pLeft = Math.floor(p.x / TILE_SIZE);
        let pRight = Math.floor((p.x + p.w) / TILE_SIZE);
        let pTop = Math.floor(p.y / TILE_SIZE);
        let pBottom = Math.floor((p.y + p.h - 1) / TILE_SIZE);

        let isScrapingWall = false;
        for (let r = pTop; r <= pBottom; r++) {
          const tileL = getTile(curRoom.x, curRoom.y, pLeft, r);
          if (isSolid(tileL)) {
            p.x = (pLeft + 1) * TILE_SIZE;
            isScrapingWall = true;
            break;
          }
          const tileR = getTile(curRoom.x, curRoom.y, pRight, r);
          if (isSolid(tileR)) {
            p.x = pRight * TILE_SIZE - p.w - 0.01;
            isScrapingWall = true;
            break;
          }
        }

        // Mid-air wall sliding friction sound
        if (
          isScrapingWall &&
          !p.grounded &&
          p.vy > 1.2 &&
          move !== 0 &&
          wallScrapeCooldownRef.current <= 0
        ) {
          wallScrapeCooldownRef.current = 14;
          AudioEngine.playStoneScrape(0.55);
          spawnPoof(
            p.facing > 0 ? p.x + p.w : p.x,
            p.y + p.h / 2,
            '#234b3e',
            2,
            0.6
          );
        }

        // Player Vertical Collision
        p.y += p.vy;
        pLeft = Math.floor(p.x / TILE_SIZE);
        pRight = Math.floor((p.x + p.w - 0.05) / TILE_SIZE);
        pTop = Math.floor(p.y / TILE_SIZE);
        pBottom = Math.floor((p.y + p.h) / TILE_SIZE);

        const wasGrounded = p.grounded;
        const prevVy = p.vy;
        for (let c = pLeft; c <= pRight; c++) {
          const tileT = getTile(curRoom.x, curRoom.y, c, pTop);
          if (p.vy < 0 && isSolid(tileT)) {
            p.y = (pTop + 1) * TILE_SIZE;
            p.vy = 0;
            break;
          }
          const tileB = getTile(curRoom.x, curRoom.y, c, pBottom);
          if (p.vy >= 0 && isSolid(tileB)) {
            if (tileB === 8 && p.vy > 5.5) {
              breakCrackedWall(curRoom.x, curRoom.y, c, pBottom);
              p.vy = -3;
              p.grounded = false;
            } else {
              p.y = pBottom * TILE_SIZE - p.h;
              if (!wasGrounded && prevVy > 2.0) {
                p.squishX = 1.35;
                p.squishY = 0.75;
                spawnPoof(p.x + p.w / 2, p.y + p.h, '#2a6a58', 3);
                // Subtle landing stone friction sound
                AudioEngine.playStoneScrape(Math.min(1.4, prevVy / 3.6));
              }
              p.vy = 0;
              p.grounded = true;
            }
            break;
          }
        }

        // Environmental water contact and ripple sound
        const feetTile = getTile(
          curRoom.x,
          curRoom.y,
          Math.floor((p.x + p.w / 2) / TILE_SIZE),
          Math.floor((p.y + p.h) / TILE_SIZE)
        );
        const centerCol = Math.floor((p.x + p.w / 2) / TILE_SIZE);
        const centerRow = Math.floor((p.y + p.h / 2) / TILE_SIZE);
        const standingTile = getTile(curRoom.x, curRoom.y, centerCol, centerRow);
        const isInWater = feetTile === 6 || standingTile === 6;

        if (isInWater) {
          // Landing into water surface splash
          if (!wasGrounded && prevVy > 2.0) {
            AudioEngine.playSplash();
            AudioEngine.playWaterRipple(1.3);
            spawnPoof(p.x + p.w / 2, p.y + p.h - 2, '#6cf8d2', 6, 0.9);
          }

          waterRippleCooldownRef.current--;
          if (waterRippleCooldownRef.current <= 0) {
            const isMovingInWater = Math.abs(p.vx) > 0.4;
            waterRippleCooldownRef.current = isMovingInWater ? 16 : 42;
            const intensity = isMovingInWater
              ? Math.min(1.2, Math.abs(p.vx) / p.speed + 0.3)
              : 0.5;
            AudioEngine.playWaterRipple(intensity);
            spawnPoof(p.x + p.w / 2, p.y + p.h - 1, '#4ee1a0', isMovingInWater ? 3 : 1, 0.7);
          }
        }

        // --- BUBBLE PHYSICS & BUBBLE JUMP ---
        for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
          const b = bubblesRef.current[i];
          b.y += b.vy;
          b.x += b.vx;
          b.vx *= 0.95;
          b.wobblePhase += 0.08;
          b.life--;

          const bTileX = Math.floor(b.x / TILE_SIZE);
          const bTileY = Math.floor((b.y - b.r) / TILE_SIZE);
          const hitTile = getTile(curRoom.x, curRoom.y, bTileX, bTileY);

          if (isSolid(hitTile)) {
            if (hitTile === 8) {
              breakCrackedWall(curRoom.x, curRoom.y, bTileX, bTileY);
            }
            b.life = 0;
          }

          // Bubble Jump!
          const playerBottom = p.y + p.h;
          const bubbleTop = b.y - b.r;
          const isHorizontallyAligned =
            p.x + p.w > b.x - b.r - 2 && p.x < b.x + b.r + 2;

          if (
            p.vy > 0 &&
            isHorizontallyAligned &&
            playerBottom >= bubbleTop - 3 &&
            playerBottom <= bubbleTop + 14
          ) {
            p.vy = p.jumpPower * 1.18;
            p.grounded = false;
            p.squishX = 0.75;
            p.squishY = 1.4;
            bubbleJumpCountRef.current++;
            AudioEngine.playBounce();
            spawnPoof(b.x, b.y, '#7bf5ff', 12);
            unlockAchievement('bubble_jump');
            bubblesRef.current.splice(i, 1);
            continue;
          }

          if (b.life <= 0) {
            spawnPoof(b.x, b.y, '#5cf2bd', 6);
            bubblesRef.current.splice(i, 1);
          }
        }

        // --- MYSTERIOUS CREATURES DISCOVERY ---
        const currentRoomCreatures = WELL_CREATURES.filter(
          (c) => c.roomKey === roomKey
        );

        currentRoomCreatures.forEach((creature) => {
          const cCenterX = creature.x + creature.w / 2;
          const cCenterY = creature.y + creature.h / 2;
          const pCenterX = p.x + p.w / 2;
          const pCenterY = p.y + p.h / 2;

          const dist = Math.hypot(pCenterX - cCenterX, pCenterY - cCenterY);
          const bubbleNearby = bubblesRef.current.some(
            (b) => Math.hypot(b.x - cCenterX, b.y - cCenterY) < 42
          );

          if ((dist < 52 || bubbleNearby) && !discoveredCreaturesRef.current.has(creature.id)) {
            discoveredCreaturesRef.current.add(creature.id);
            if (creature.id === 'phosphor_toad') {
              AudioEngine.playCroak();
            }
            AudioEngine.playCreatureDiscovery();
            spawnPoof(cCenterX, cCenterY, creature.glowColor, 26, 1.5);
            showToast(`✦ 發現神秘生靈：${creature.name}！已登錄至生態圖鑑`);
            unlockAchievement('creature_scholar');
            if (discoveredCreaturesRef.current.size >= WELL_CREATURES.length) {
              unlockAchievement('master_naturalist');
            }
            saveGame();
          } else if ((dist < 45 || bubbleNearby) && discoveredCreaturesRef.current.has(creature.id)) {
            // Already discovered: playful reaction when bubble or player gets close
            if (bubbleNearby && Math.random() < 0.04) {
              if (creature.id === 'phosphor_toad') {
                AudioEngine.playCroak();
                spawnPoof(cCenterX, cCenterY, '#38e8ac', 3, 0.6);
              }
            }
          }
        });

        // --- DYNAMIC PROXIMITY AMBIENT SOUND (Web Audio API) ---
        const pCenterX = p.x + p.w / 2;
        const pCenterY = p.y + p.h / 2;
        let minProximityDistance = 9999;

        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (map[r]?.[c] === 5) {
              const ex = c * TILE_SIZE + 15;
              const ey = r * TILE_SIZE + 15;
              const dist = Math.hypot(pCenterX - ex, pCenterY - ey);
              if (dist < minProximityDistance) minProximityDistance = dist;
            }
          }
        }

        currentRoomCreatures.forEach((cr) => {
          const crx = cr.x + cr.w / 2;
          const cry = cr.y + cr.h / 2;
          const dist = Math.hypot(pCenterX - crx, pCenterY - cry);
          if (dist < minProximityDistance) minProximityDistance = dist;
        });

        AudioEngine.updateProximity(minProximityDistance);

        // --- TRIGGERS & TILES ---
        // Floor Switch (Tile 4)
        if (standingTile === 4 && !switchPressedRef.current) {
          switchPressedRef.current = true;
          AudioEngine.playSwitch();
          spawnPoof(centerCol * TILE_SIZE + 15, centerRow * TILE_SIZE + 20, '#ffe359', 14);
          showToast('踏下開關 · 遠處閘門解鎖！');
        }

        // Mystical Egg (Tile 5)
        if (standingTile === 5) {
          setTile(curRoom.x, curRoom.y, centerCol, centerRow, 0);
          eggsCollectedRef.current++;
          AudioEngine.playEgg();
          spawnPoof(centerCol * TILE_SIZE + 15, centerRow * TILE_SIZE + 15, '#ff80ea', 20);

          unlockAchievement('first_egg');

          if (eggsCollectedRef.current >= 3) {
            spawnPoof(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '#9cffeb', 30);
            showToast('★ 尋齊 3 顆彩蛋！遠古祭壇封印解除！');
            unlockAchievement('all_eggs');
          } else {
            showToast(`尋得神秘彩蛋 (${eggsCollectedRef.current}/3)`);
          }
        }

        // Save Telephone Booth (Tile 9)
        if (standingTile === 9 || getTile(curRoom.x, curRoom.y, centerCol, centerRow + 1) === 9) {
          if (telephoneCooldownRef.current <= 0) {
            telephoneCooldownRef.current = 150;
            saveGame();
            showToast('☎ 幽井電話亭：記錄點進度已儲存！');
            spawnPoof(centerCol * TILE_SIZE + 15, centerRow * TILE_SIZE + 15, '#ffe359', 16);
            unlockAchievement('save_phone');
          }
        }

        // Win Condition: Altar in room [0,0]
        if (
          eggsCollectedRef.current >= 3 &&
          curRoom.x === 0 &&
          curRoom.y === 0 &&
          p.x > 20 &&
          p.x < 120 &&
          p.y < 80 &&
          !isCompletedRef.current
        ) {
          isCompletedRef.current = true;
          AudioEngine.playWin();
          spawnPoof(p.x, p.y, '#fffb8f', 35);
          unlockAchievement('well_liberated');
          onWinTriggered(timerSecondsRef.current);
        }

        // Screen Transition
        let roomChanged = false;
        if (p.x < 0) {
          if (curRoom.x > 0) {
            curRoom.x--;
            p.x = CANVAS_WIDTH - p.w - 2;
            roomChanged = true;
          } else {
            p.x = 0;
          }
        } else if (p.x + p.w > CANVAS_WIDTH) {
          if (curRoom.x < 1) {
            curRoom.x++;
            p.x = 2;
            roomChanged = true;
          } else {
            p.x = CANVAS_WIDTH - p.w;
          }
        }

        if (p.y < 0) {
          if (curRoom.y > 0) {
            curRoom.y--;
            p.y = CANVAS_HEIGHT - p.h - 2;
            roomChanged = true;
          } else {
            p.y = 0;
          }
        } else if (p.y + p.h > CANVAS_HEIGHT) {
          if (curRoom.y < 1) {
            curRoom.y++;
            p.y = 2;
            roomChanged = true;
          } else {
            p.y = CANVAS_HEIGHT - p.h;
          }
        }

        if (roomChanged) {
          bubblesRef.current = [];
          const nextRoomKey = `${curRoom.x},${curRoom.y}`;
          visitedRoomsRef.current.add(nextRoomKey);
        }

        if (!isCompletedRef.current) {
          timerSecondsRef.current = Math.floor(
            (Date.now() - startTimeRef.current) / 1000
          );
        }

        firefliesRef.current.forEach((f) => {
          f.x += f.vx;
          f.y += f.vy;
          if (f.x < 0) f.x = CANVAS_WIDTH;
          if (f.x > CANVAS_WIDTH) f.x = 0;
          if (f.y < 0) f.y = CANVAS_HEIGHT;
          if (f.y > CANVAS_HEIGHT) f.y = 0;
        });

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const pt = particlesRef.current[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life--;
          if (pt.life <= 0) particlesRef.current.splice(i, 1);
        }

        if (toastRef.current) {
          toastRef.current.timer--;
          if (toastRef.current.timer <= 0) {
            toastRef.current = null;
          }
        }

        const currentRoomKey = `${curRoom.x},${curRoom.y}`;
        onStatsUpdate({
          eggs: eggsCollectedRef.current,
          totalEggs: 3,
          roomKey: currentRoomKey,
          roomName: ROOM_NAMES[currentRoomKey] || '神秘幽谷',
          switchPressed: switchPressedRef.current,
          pressurePlatformActive: pressurePlatformActiveRef.current,
          visitedRooms: Array.from(visitedRoomsRef.current),
          discoveredCreatures: Array.from(discoveredCreaturesRef.current),
          totalCreatures: WELL_CREATURES.length,
          unlockedAchievements: Array.from(unlockedAchievementsRef.current),
          totalAchievements: Object.keys(ACHIEVEMENT_DEFINITIONS).length,
          currentWeather: currentWeatherRef.current,
          isCompleted: isCompletedRef.current,
          timerSeconds: timerSecondsRef.current,
          hasSaveFile: SaveManager.hasSave(),
        });
      };

      const render = () => {
        const p = playerRef.current;
        const curRoom = currentRoomRef.current;
        const roomKey = `${curRoom.x},${curRoom.y}`;
        const map = mapDataRef.current[roomKey] || [];
        const now = Date.now();

        ctx.fillStyle = '#04070a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Background grid
        ctx.strokeStyle = 'rgba(10, 30, 26, 0.35)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= CANVAS_WIDTH; x += TILE_SIZE) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, CANVAS_HEIGHT);
          ctx.stroke();
        }
        for (let y = 0; y <= CANVAS_HEIGHT; y += TILE_SIZE) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(CANVAS_WIDTH, y);
          ctx.stroke();
        }

        // Draw Tiles
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const tile = map[r]?.[c] ?? 0;
            const tx = c * TILE_SIZE;
            const ty = r * TILE_SIZE;

            if (tile === 1) {
              ctx.fillStyle = '#0f1f1d';
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#183832';
              ctx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
              ctx.fillStyle = '#1e443c';
              ctx.fillRect(tx + 4, ty + 4, 2, 2);
              ctx.fillRect(tx + 22, ty + 18, 3, 2);
            } else if (tile === 8) {
              ctx.fillStyle = '#11221e';
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#2d5e53';
              ctx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);

              const crackPulse = Math.sin(now * 0.006 + c) * 0.3 + 0.7;
              ctx.strokeStyle = `rgba(255, 215, 60, ${crackPulse})`;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(tx + 4, ty + 6);
              ctx.lineTo(tx + 14, ty + 15);
              ctx.lineTo(tx + 12, ty + 24);
              ctx.moveTo(tx + 14, ty + 15);
              ctx.lineTo(tx + 24, ty + 12);
              ctx.lineTo(tx + 26, ty + 22);
              ctx.stroke();
            } else if (tile === 9) {
              ctx.save();
              ctx.fillStyle = '#162e26';
              ctx.fillRect(tx + 5, ty + 2, TILE_SIZE - 10, TILE_SIZE - 2);
              ctx.strokeStyle = '#4de2b2';
              ctx.lineWidth = 1.2;
              ctx.strokeRect(tx + 5, ty + 2, TILE_SIZE - 10, TILE_SIZE - 2);

              const bellGlow = Math.sin(now * 0.005) * 4 + 6;
              ctx.shadowColor = '#5cffd2';
              ctx.shadowBlur = bellGlow;
              ctx.fillStyle = '#5cffd2';
              ctx.fillRect(tx + 11, ty + 8, 8, 5);
              ctx.fillRect(tx + 13, ty + 15, 4, 6);

              ctx.fillStyle = '#ffe359';
              ctx.beginPath();
              ctx.arc(tx + 15, ty + 4, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            } else if (tile === 10) {
              const isActive = pressurePlatformActiveRef.current;
              ctx.save();
              ctx.fillStyle = '#10241f';
              ctx.fillRect(tx + 2, ty + 18, TILE_SIZE - 4, 12);
              ctx.strokeStyle = isActive ? '#45ffaa' : '#ffd447';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(tx + 2, ty + 18, TILE_SIZE - 4, 12);

              ctx.fillStyle = isActive ? '#246b55' : '#423214';
              const plateY = ty + (isActive ? 24 : 19);
              ctx.fillRect(tx + 5, plateY, TILE_SIZE - 10, 5);

              ctx.fillStyle = isActive ? '#5cffd2' : '#e6b800';
              ctx.fillRect(tx + 7, ty + 26, 4, 2);
              ctx.fillRect(tx + 19, ty + 26, 4, 2);
              ctx.restore();
            } else if (tile === 11) {
              const isOpen = pressurePlatformActiveRef.current;
              ctx.save();
              if (isOpen) {
                ctx.fillStyle = '#081713';
                ctx.fillRect(tx + 2, ty + 24, TILE_SIZE - 4, 6);
                ctx.strokeStyle = '#275e4e';
                ctx.strokeRect(tx + 2, ty + 24, TILE_SIZE - 4, 6);
              } else {
                ctx.fillStyle = '#1b3b32';
                ctx.fillRect(tx + 4, ty, TILE_SIZE - 8, TILE_SIZE);
                ctx.strokeStyle = '#38e8ac';
                ctx.lineWidth = 1.2;
                ctx.strokeRect(tx + 4, ty, TILE_SIZE - 8, TILE_SIZE);

                ctx.fillStyle = '#5cffd2';
                ctx.fillRect(tx + 11, ty + 11, 8, 8);
                ctx.fillStyle = '#081713';
                ctx.fillRect(tx + 13, ty + 13, 4, 4);
              }
              ctx.restore();
            } else if (tile === 3) {
              const isOpen = switchPressedRef.current;
              if (isOpen) {
                ctx.fillStyle = '#0b1614';
                ctx.fillRect(tx + 8, ty, TILE_SIZE - 16, TILE_SIZE);
                ctx.strokeStyle = '#1e3d36';
                ctx.strokeRect(tx + 8, ty, TILE_SIZE - 16, TILE_SIZE);
              } else {
                ctx.fillStyle = '#4a0f1b';
                ctx.fillRect(tx + 6, ty, TILE_SIZE - 12, TILE_SIZE);
                ctx.fillStyle = '#ff2b55';
                ctx.shadowColor = '#ff3366';
                ctx.shadowBlur = 6;
                ctx.fillRect(tx + 11, ty + 8, 8, 14);
                ctx.shadowBlur = 0;
              }
            } else if (tile === 4) {
              const pressed = switchPressedRef.current;
              ctx.fillStyle = '#162923';
              ctx.fillRect(tx + 3, ty + 24, TILE_SIZE - 6, 6);
              ctx.fillStyle = pressed ? '#45ffaa' : '#ffcf33';
              ctx.shadowColor = pressed ? '#45ffaa' : '#ffcf33';
              ctx.shadowBlur = pressed ? 8 : 4;
              ctx.fillRect(
                tx + 6,
                ty + (pressed ? 27 : 24),
                TILE_SIZE - 12,
                pressed ? 3 : 6
              );
              ctx.shadowBlur = 0;
            } else if (tile === 5) {
              const floatOffset = Math.sin(now * 0.005 + c * 2) * 3;
              const ex = tx + 15;
              const ey = ty + 15 + floatOffset;

              ctx.save();
              ctx.shadowColor = '#ff6beb';
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.ellipse(ex, ey, 7.5, 10.5, 0, 0, Math.PI * 2);
              ctx.fillStyle = '#ff75e8';
              ctx.fill();

              ctx.beginPath();
              ctx.ellipse(ex - 2, ey - 3, 2.5, 4.5, -0.3, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
              ctx.restore();
            } else if (tile === 6) {
              const wave = Math.sin(now * 0.004 + c) * 1.5;
              ctx.fillStyle = 'rgba(12, 65, 68, 0.75)';
              ctx.fillRect(tx, ty + 12, TILE_SIZE, TILE_SIZE - 12);
              ctx.fillStyle = '#4ee1a0';
              ctx.fillRect(tx, ty + 12 + wave, TILE_SIZE, 2);
              ctx.fillStyle = 'rgba(110, 255, 215, 0.15)';
              ctx.fillRect(tx + 4, ty + 16, TILE_SIZE - 8, 4);
            }
          }
        }

        // Draw Pushable Blocks
        const activeRoomBlocks = blocksRef.current.filter(
          (b) => b.roomKey === roomKey
        );
        activeRoomBlocks.forEach((block) => {
          ctx.save();
          ctx.fillStyle = '#1c3d36';
          ctx.fillRect(block.x, block.y, block.w, block.h);
          ctx.strokeStyle = '#3de8b0';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(block.x + 0.5, block.y + 0.5, block.w - 1, block.h - 1);

          ctx.strokeStyle = '#5cffd2';
          ctx.lineWidth = 1;
          const cx = block.x + block.w / 2;
          const cy = block.y + block.h / 2;
          ctx.strokeRect(cx - 4, cy - 4, 8, 8);
          ctx.fillStyle = '#2de4aa';
          ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
          ctx.restore();
        });

        // Draw Creatures
        const activeCreatures = WELL_CREATURES.filter((c) => c.roomKey === roomKey);
        activeCreatures.forEach((creature) => {
          const isDiscovered = discoveredCreaturesRef.current.has(creature.id);
          const cx = creature.x;
          const cy = creature.y;

          ctx.save();

          // Visual prompt for undiscovered creatures
          if (!isDiscovered) {
            const auraScale = 1 + Math.sin(now * 0.005) * 0.18;
            ctx.strokeStyle = creature.glowColor;
            ctx.lineWidth = 1;
            ctx.shadowColor = creature.glowColor;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(cx + 9, cy + 8, 14 * auraScale, 0, Math.PI * 2);
            ctx.stroke();

            const bob = Math.sin(now * 0.004) * 2;
            ctx.fillStyle = '#65ffd8';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#65ffd8';
            ctx.shadowBlur = 4;
            ctx.fillText('▼ 靠近/吹泡泡', cx + 9, cy - 7 + bob);
          } else {
            ctx.fillStyle = 'rgba(78, 255, 190, 0.45)';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('♥ 已記錄', cx + 9, cy - 6);
          }

          if (creature.id === 'phosphor_toad') {
            const throatPuff = Math.sin(now * 0.004) * 2;
            ctx.shadowColor = creature.glowColor;
            ctx.shadowBlur = isDiscovered ? 10 : 6;
            ctx.fillStyle = creature.color;

            // Frog body
            ctx.beginPath();
            ctx.ellipse(cx + 9, cy + 9, 8, 6 + throatPuff * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Webbed feet
            ctx.fillStyle = '#26b884';
            ctx.fillRect(cx + 2, cy + 13, 4, 2);
            ctx.fillRect(cx + 12, cy + 13, 4, 2);

            // Frog eyes tracking player
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx + 4, cy + 2, 3, 3);
            ctx.fillRect(cx + 11, cy + 2, 3, 3);
            ctx.fillStyle = '#061a15';
            const eyeDir = p.x < cx ? -0.5 : 0.5;
            ctx.fillRect(cx + 5 + eyeDir, cy + 3, 1.5, 1.5);
            ctx.fillRect(cx + 12 + eyeDir, cy + 3, 1.5, 1.5);
          } else if (creature.id === 'well_feline') {
            const tailSwing = Math.sin(now * 0.003) * 4;
            ctx.shadowColor = creature.glowColor;
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#eafcf7';

            ctx.beginPath();
            ctx.ellipse(cx + 9, cy + 9, 6.5, 5, 0, 0, Math.PI * 2);
            ctx.arc(cx + 5, cy + 5, 4.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(cx + 2, cy + 2);
            ctx.lineTo(cx + 4, cy - 2);
            ctx.lineTo(cx + 6, cy + 2);
            ctx.moveTo(cx + 6, cy + 2);
            ctx.lineTo(cx + 8, cy - 2);
            ctx.lineTo(cx + 10, cy + 2);
            ctx.fill();

            ctx.strokeStyle = '#eafcf7';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx + 14, cy + 9);
            ctx.quadraticCurveTo(cx + 18 + tailSwing, cy + 5, cx + 16, cy + 2);
            ctx.stroke();

            ctx.fillStyle = '#3effd4';
            ctx.fillRect(cx + 3, cy + 4, 1.5, 2);
            ctx.fillRect(cx + 6, cy + 4, 1.5, 2);
          } else if (creature.id === 'abyssal_jelly') {
            const floatY = Math.sin(now * 0.003) * 3;
            ctx.shadowColor = creature.glowColor;
            ctx.shadowBlur = 12;
            ctx.fillStyle = 'rgba(215, 145, 255, 0.7)';

            ctx.beginPath();
            ctx.arc(cx + 9, cy + 6 + floatY, 7, Math.PI, 0);
            ctx.fill();

            ctx.strokeStyle = 'rgba(235, 175, 255, 0.65)';
            ctx.lineWidth = 1.2;
            for (let t = 0; t < 3; t++) {
              const txOffset = (t - 1) * 4;
              const tentWave = Math.sin(now * 0.005 + t) * 3;
              ctx.beginPath();
              ctx.moveTo(cx + 9 + txOffset, cy + 6 + floatY);
              ctx.quadraticCurveTo(
                cx + 9 + txOffset + tentWave,
                cy + 12 + floatY,
                cx + 9 + txOffset,
                cy + 17 + floatY
              );
              ctx.stroke();
            }
          } else if (creature.id === 'ancient_gecko') {
            const breathe = Math.sin(now * 0.004) * 1.5;
            ctx.shadowColor = creature.glowColor;
            ctx.shadowBlur = 8;
            ctx.fillStyle = creature.color;

            ctx.beginPath();
            ctx.ellipse(cx + 9, cy + 6, 7 + breathe, 4, 0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = creature.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx + 15, cy + 7);
            ctx.arc(cx + 18, cy + 5, 3, 0, Math.PI);
            ctx.stroke();

            ctx.fillStyle = '#061714';
            ctx.fillRect(cx + 4, cy + 4, 2, 2);
          }
          ctx.restore();
        });

        // Sacred Shrine in [0,0]
        if (curRoom.x === 0 && curRoom.y === 0) {
          ctx.save();
          ctx.strokeStyle = '#2b6e5e';
          ctx.strokeRect(30, 20, 60, 40);
          ctx.fillStyle = eggsCollectedRef.current >= 3 ? '#ffe359' : '#1d3e37';
          ctx.font = '10px monospace';
          ctx.fillText(
            eggsCollectedRef.current >= 3 ? '★ 封印之泉 ★' : '封印祭壇 (3 蛋)',
            24,
            15
          );
          ctx.restore();
        }

        // Fireflies
        firefliesRef.current.forEach((f) => {
          const pulse = Math.sin(now * f.pulseSpeed + f.x) * 0.35 + 0.65;
          ctx.fillStyle = `hsla(${f.hue}, 100%, 75%, ${f.alpha * pulse})`;
          ctx.fillRect(f.x, f.y, 2, 2);
        });

        // Weather particles
        weatherParticlesRef.current.forEach((wp) => {
          ctx.save();
          ctx.globalAlpha = wp.alpha * (wp.life / wp.maxLife);
          ctx.fillStyle = wp.color;
          ctx.shadowColor = wp.color;
          ctx.shadowBlur = 4;
          if (currentWeatherRef.current === 'WATER_DROPLETS') {
            ctx.fillRect(wp.x, wp.y, 1.5, 4);
          } else {
            ctx.beginPath();
            ctx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });

        // Bubbles
        bubblesRef.current.forEach((b) => {
          ctx.save();
          const wobbleX = Math.sin(b.wobblePhase) * 1.2;
          const wobbleY = Math.cos(b.wobblePhase * 1.3) * 0.8;

          ctx.beginPath();
          ctx.arc(b.x + wobbleX, b.y + wobbleY, b.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(75, 230, 210, 0.18)';
          ctx.fill();

          ctx.strokeStyle = '#9cffeb';
          ctx.lineWidth = 1.6;
          ctx.shadowColor = '#5cffd2';
          ctx.shadowBlur = 6;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(b.x + wobbleX - 4, b.y + wobbleY - 5, 2.5, 2.5);
          ctx.restore();
        });

        // Particles
        particlesRef.current.forEach((pt) => {
          const alpha = pt.life / pt.maxLife;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = pt.color;
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 4;
          ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
          ctx.restore();
        });

        // Player
        ctx.save();
        const pCenterX = p.x + p.w / 2;
        const pCenterY = p.y + p.h / 2;

        ctx.translate(pCenterX, pCenterY);
        ctx.scale(p.squishX, p.squishY);

        ctx.shadowColor = '#5cffd2';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#f0fffa';
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#75ffd9';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (!p.isBlinking) {
          ctx.fillStyle = '#061714';
          const eyeOffset = p.facing > 0 ? 2.5 : -2.5;
          ctx.fillRect(eyeOffset - 1, -2, 2, 3);
          ctx.fillRect(eyeOffset + 3 * p.facing, -2, 2, 3);
        } else {
          ctx.strokeStyle = '#061714';
          ctx.lineWidth = 1;
          const eyeOffset = p.facing > 0 ? 2 : -2;
          ctx.beginPath();
          ctx.moveTo(eyeOffset - 2, 0);
          ctx.lineTo(eyeOffset + 4 * p.facing, 0);
          ctx.stroke();
        }
        ctx.restore();

        // --- DYNAMIC LIGHTING / FOG OF WAR ENGINE ---
        if (lightCtx) {
          lightCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          lightCtx.fillStyle = 'rgba(3, 7, 10, 0.78)';
          lightCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          lightCtx.globalCompositeOperation = 'destination-out';

          // 1. Player Glow
          const pGlow = lightCtx.createRadialGradient(
            p.x + p.w / 2,
            p.y + p.h / 2,
            4,
            p.x + p.w / 2,
            p.y + p.h / 2,
            72
          );
          pGlow.addColorStop(0, 'rgba(0,0,0,1)');
          pGlow.addColorStop(0.5, 'rgba(0,0,0,0.75)');
          pGlow.addColorStop(1, 'rgba(0,0,0,0)');
          lightCtx.fillStyle = pGlow;
          lightCtx.beginPath();
          lightCtx.arc(p.x + p.w / 2, p.y + p.h / 2, 72, 0, Math.PI * 2);
          lightCtx.fill();

          // 2. Bubble Glow
          bubblesRef.current.forEach((b) => {
            const bGlow = lightCtx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 42);
            bGlow.addColorStop(0, 'rgba(0,0,0,0.85)');
            bGlow.addColorStop(1, 'rgba(0,0,0,0)');
            lightCtx.fillStyle = bGlow;
            lightCtx.beginPath();
            lightCtx.arc(b.x, b.y, 42, 0, Math.PI * 2);
            lightCtx.fill();
          });

          // 3. Tile Glows
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              const tile = map[r]?.[c];
              const ex = c * TILE_SIZE + 15;
              const ey = r * TILE_SIZE + 15;

              if (tile === 5) {
                const eGlow = lightCtx.createRadialGradient(ex, ey, 2, ex, ey, 50);
                eGlow.addColorStop(0, 'rgba(0,0,0,0.92)');
                eGlow.addColorStop(1, 'rgba(0,0,0,0)');
                lightCtx.fillStyle = eGlow;
                lightCtx.beginPath();
                lightCtx.arc(ex, ey, 50, 0, Math.PI * 2);
                lightCtx.fill();
              } else if (tile === 4 || tile === 10) {
                const sGlow = lightCtx.createRadialGradient(ex, ey + 9, 2, ex, ey + 9, 44);
                sGlow.addColorStop(0, 'rgba(0,0,0,0.85)');
                sGlow.addColorStop(1, 'rgba(0,0,0,0)');
                lightCtx.fillStyle = sGlow;
                lightCtx.beginPath();
                lightCtx.arc(ex, ey + 9, 44, 0, Math.PI * 2);
                lightCtx.fill();
              } else if (tile === 9) {
                const phoneGlow = lightCtx.createRadialGradient(ex, ey, 2, ex, ey, 60);
                phoneGlow.addColorStop(0, 'rgba(0,0,0,0.95)');
                phoneGlow.addColorStop(1, 'rgba(0,0,0,0)');
                lightCtx.fillStyle = phoneGlow;
                lightCtx.beginPath();
                lightCtx.arc(ex, ey, 60, 0, Math.PI * 2);
                lightCtx.fill();
              } else if (tile === 8) {
                const cGlow = lightCtx.createRadialGradient(ex, ey, 2, ex, ey, 25);
                cGlow.addColorStop(0, 'rgba(0,0,0,0.6)');
                cGlow.addColorStop(1, 'rgba(0,0,0,0)');
                lightCtx.fillStyle = cGlow;
                lightCtx.beginPath();
                lightCtx.arc(ex, ey, 25, 0, Math.PI * 2);
                lightCtx.fill();
              }
            }
          }

          // 4. Creature Bioluminescent Light
          activeCreatures.forEach((creature) => {
            const isDiscovered = discoveredCreaturesRef.current.has(creature.id);
            const crx = creature.x + creature.w / 2;
            const cry = creature.y + creature.h / 2;
            const radius = isDiscovered ? 48 : 34;

            const crGlow = lightCtx.createRadialGradient(crx, cry, 2, crx, cry, radius);
            crGlow.addColorStop(0, 'rgba(0,0,0,0.88)');
            crGlow.addColorStop(1, 'rgba(0,0,0,0)');
            lightCtx.fillStyle = crGlow;
            lightCtx.beginPath();
            lightCtx.arc(crx, cry, radius, 0, Math.PI * 2);
            lightCtx.fill();
          });

          ctx.drawImage(lightCanvas, 0, 0);
        }

        // 5. In-game Toast Notification Banner
        if (toastRef.current) {
          ctx.save();
          const alpha = Math.min(1, toastRef.current.timer / 20);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = 'rgba(6, 20, 16, 0.88)';
          ctx.strokeStyle = '#4de2b2';
          ctx.lineWidth = 1;

          const toastW = 340;
          const toastH = 26;
          const toastX = (CANVAS_WIDTH - toastW) / 2;
          const toastY = 16;

          ctx.fillRect(toastX, toastY, toastW, toastH);
          ctx.strokeRect(toastX, toastY, toastW, toastH);

          ctx.fillStyle = '#6efdd3';
          ctx.font = '11px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(toastRef.current.text, CANVAS_WIDTH / 2, toastY + toastH / 2);
          ctx.restore();
        }
      };

      const loop = () => {
        updatePhysics();
        render();
        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animId);
      };
    }, [
      breakCrackedWall,
      getTile,
      isSolid,
      loadGame,
      onStatsUpdate,
      onWinTriggered,
      saveGame,
      setTile,
      showToast,
      spawnPoof,
      touchActive,
      unlockAchievement,
    ]);

    // Touch handlers for mobile
    const handleTouchStart = (action: 'left' | 'right' | 'jump' | 'bubble') => {
      AudioEngine.init();
      if (action === 'bubble') {
        spawnBubble();
      } else {
        setTouchActive((prev) => ({ ...prev, [action]: true }));
      }
    };

    const handleTouchEnd = (action: 'left' | 'right' | 'jump' | 'bubble') => {
      if (action !== 'bubble') {
        setTouchActive((prev) => ({ ...prev, [action]: false }));
      }
    };

    return (
      <div className="relative flex flex-col items-center">
        {/* Game Screen Container with Animal Well styled phosphor glow border */}
        <div
          ref={containerRef}
          className="relative rounded-lg overflow-hidden border border-emerald-950/80 shadow-[0_0_40px_rgba(20,255,160,0.12),0_10px_40px_rgba(0,0,0,0.9)] bg-black"
          style={{
            width: '100%',
            maxWidth: '860px',
            aspectRatio: '16/9',
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full block"
            style={{
              imageRendering: 'pixelated',
            }}
          />

          {/* CRT Scanline Filter */}
          {crtEnabled && (
            <div
              className="absolute inset-0 pointer-events-none select-none"
              style={{
                background:
                  'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.42) 50%)',
                backgroundSize: '100% 4px',
                opacity: 0.65,
              }}
            />
          )}

          {/* CRT Radial Vignette */}
          {crtEnabled && (
            <div
              className="absolute inset-0 pointer-events-none select-none"
              style={{
                background:
                  'radial-gradient(circle at center, transparent 55%, rgba(1, 4, 7, 0.88) 100%)',
              }}
            />
          )}
        </div>

        {/* Touch Screen Controls for Mobile/Tablets */}
        <div className="md:hidden flex items-center justify-between w-full max-w-[860px] px-3 pt-3 select-none">
          <div className="flex gap-2">
            <button
              type="button"
              className="w-14 h-14 bg-emerald-950/60 border border-emerald-700/60 rounded-lg active:bg-emerald-700/50 text-emerald-300 font-mono text-xl flex items-center justify-center touch-manipulation shadow-md"
              onTouchStart={() => handleTouchStart('left')}
              onTouchEnd={() => handleTouchEnd('left')}
              onMouseDown={() => handleTouchStart('left')}
              onMouseUp={() => handleTouchEnd('left')}
              aria-label="向左走"
            >
              ◀
            </button>
            <button
              type="button"
              className="w-14 h-14 bg-emerald-950/60 border border-emerald-700/60 rounded-lg active:bg-emerald-700/50 text-emerald-300 font-mono text-xl flex items-center justify-center touch-manipulation shadow-md"
              onTouchStart={() => handleTouchStart('right')}
              onTouchEnd={() => handleTouchEnd('right')}
              onMouseDown={() => handleTouchStart('right')}
              onMouseUp={() => handleTouchEnd('right')}
              aria-label="向右走"
            >
              ▶
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="w-14 h-14 bg-teal-950/60 border border-teal-500/60 rounded-lg active:bg-teal-700/60 text-teal-200 font-mono text-xs flex flex-col items-center justify-center touch-manipulation shadow-md"
              onTouchStart={() => handleTouchStart('bubble')}
              onClick={() => spawnBubble()}
              aria-label="吐泡泡"
            >
              <span className="text-base">🫧</span>
              <span>泡泡</span>
            </button>
            <button
              type="button"
              className="w-14 h-14 bg-emerald-900/60 border border-emerald-400/70 rounded-lg active:bg-emerald-600/70 text-emerald-100 font-mono text-xs flex flex-col items-center justify-center touch-manipulation shadow-md"
              onTouchStart={() => handleTouchStart('jump')}
              onTouchEnd={() => handleTouchEnd('jump')}
              onMouseDown={() => handleTouchStart('jump')}
              onMouseUp={() => handleTouchEnd('jump')}
              aria-label="跳躍"
            >
              <span className="text-base">▲</span>
              <span>跳躍</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

GlowWellGame.displayName = 'GlowWellGame';
