// Minimum Spanning Tree and connectivity utilities

import { Room, Corridor, Point, Edge } from '../types/generator';

export class ConnectivityUtils {
  // Get center point of a room
  static getRoomCenter(room: Room): Point {
    return {
      x: room.x + room.width / 2,
      y: room.y + room.height / 2
    };
  }

  // Calculate distance between two points
  static distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Build Minimum Spanning Tree using Prim's algorithm
  static buildMST(rooms: Room[]): Edge[] {
    if (rooms.length < 2) return [];

    const centers = rooms.map(r => this.getRoomCenter(r));
    const edges: Edge[] = [];
    const inMST = new Set<number>([0]); // Start with first room
    const available: Edge[] = [];

    // Add all edges from first room
    for (let i = 1; i < rooms.length; i++) {
      available.push({
        from: 0,
        to: i,
        weight: this.distance(centers[0], centers[i])
      });
    }

    // Build MST
    while (inMST.size < rooms.length && available.length > 0) {
      // Sort by weight and get minimum
      available.sort((a, b) => a.weight - b.weight);
      const edge = available.shift()!;

      if (!inMST.has(edge.to)) {
        edges.push(edge);
        inMST.add(edge.to);

        // Add new edges from the newly added room
        for (let i = 0; i < rooms.length; i++) {
          if (!inMST.has(i)) {
            available.push({
              from: edge.to,
              to: i,
              weight: this.distance(centers[edge.to], centers[i])
            });
          }
        }
      }
    }

    return edges;
  }

  // Connect rooms using MST
  static connectRooms(rooms: Room[]): Corridor[] {
    const mst = this.buildMST(rooms);
    const corridors: Corridor[] = [];

    for (const edge of mst) {
      const room1 = rooms[edge.from];
      const room2 = rooms[edge.to];
      const center1 = this.getRoomCenter(room1);
      const center2 = this.getRoomCenter(room2);

      corridors.push({
        start: [Math.round(center1.x), Math.round(center1.y)],
        end: [Math.round(center2.x), Math.round(center2.y)]
      });
    }

    return corridors;
  }

  // Add additional corridors for extra connectivity
  static addExtraConnections(
    rooms: Room[], 
    baseCorridor: Corridor[], 
    factor: number = 0.15
  ): Corridor[] {
    const extraCount = Math.floor(rooms.length * factor);
    const centers = rooms.map(r => this.getRoomCenter(r));
    const corridors = [...baseCorridor];

    // Create connection map
    const connections = new Set<string>();
    for (const corridor of baseCorridor) {
      connections.add(`${corridor.start[0]},${corridor.start[1]}-${corridor.end[0]},${corridor.end[1]}`);
    }

    // Add random extra connections
    let added = 0;
    let attempts = 0;
    const maxAttempts = rooms.length * 2;

    while (added < extraCount && attempts < maxAttempts) {
      const i = Math.floor(Math.random() * rooms.length);
      const j = Math.floor(Math.random() * rooms.length);
      
      if (i !== j) {
        const key = `${centers[i].x},${centers[i].y}-${centers[j].x},${centers[j].y}`;
        const reverseKey = `${centers[j].x},${centers[j].y}-${centers[i].x},${centers[i].y}`;
        
        if (!connections.has(key) && !connections.has(reverseKey)) {
          corridors.push({
            start: [Math.round(centers[i].x), Math.round(centers[i].y)],
            end: [Math.round(centers[j].x), Math.round(centers[j].y)]
          });
          connections.add(key);
          added++;
        }
      }
      attempts++;
    }

    return corridors;
  }

  // Check if rooms overlap
  static roomsOverlap(r1: Room, r2: Room, padding: number = 1): boolean {
    return !(
      r1.x + r1.width + padding < r2.x ||
      r2.x + r2.width + padding < r1.x ||
      r1.y + r1.height + padding < r2.y ||
      r2.y + r2.height + padding < r1.y
    );
  }

  // Check if point is inside room
  static pointInRoom(point: Point, room: Room): boolean {
    return (
      point.x >= room.x &&
      point.x < room.x + room.width &&
      point.y >= room.y &&
      point.y < room.y + room.height
    );
  }
}
