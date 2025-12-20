export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds extends Position, Size {}

export interface AlignableElement {
  id: string;
  position: Position;
  size: Size;
}

export type AlignmentType =
  | 'left'
  | 'center-horizontal'
  | 'right'
  | 'top'
  | 'center-vertical'
  | 'bottom'
  | 'distribute-horizontal'
  | 'distribute-vertical';

export interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  source: string;
}

export class AlignmentTools {
  static getBounds(element: AlignableElement): Bounds {
    return {
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height
    };
  }

  static getCenter(bounds: Bounds): Position {
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    };
  }

  static getCommonBounds(elements: AlignableElement[]): Bounds {
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(element => {
      const bounds = this.getBounds(element);
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  static alignElements(
    elements: AlignableElement[],
    type: AlignmentType,
    canvasBounds?: Bounds
  ): AlignableElement[] {
    if (elements.length === 0) return elements;

    const commonBounds = this.getCommonBounds(elements);
    const alignTo = canvasBounds || commonBounds;

    return elements.map(element => {
      const bounds = this.getBounds(element);
      const newPosition = { ...element.position };

      switch (type) {
        case 'left':
          newPosition.x = alignTo.x;
          break;

        case 'center-horizontal':
          newPosition.x = alignTo.x + (alignTo.width - bounds.width) / 2;
          break;

        case 'right':
          newPosition.x = alignTo.x + alignTo.width - bounds.width;
          break;

        case 'top':
          newPosition.y = alignTo.y;
          break;

        case 'center-vertical':
          newPosition.y = alignTo.y + (alignTo.height - bounds.height) / 2;
          break;

        case 'bottom':
          newPosition.y = alignTo.y + alignTo.height - bounds.height;
          break;

        default:
          break;
      }

      return {
        ...element,
        position: newPosition
      };
    });
  }

  static distributeElements(
    elements: AlignableElement[],
    type: 'horizontal' | 'vertical'
  ): AlignableElement[] {
    if (elements.length < 3) return elements;

    const sorted = [...elements].sort((a, b) => {
      if (type === 'horizontal') {
        return a.position.x - b.position.x;
      }
      return a.position.y - b.position.y;
    });

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const totalSpace = type === 'horizontal'
      ? (last.position.x + last.size.width) - first.position.x
      : (last.position.y + last.size.height) - first.position.y;

    const totalElementSize = sorted.reduce((sum, el) => {
      return sum + (type === 'horizontal' ? el.size.width : el.size.height);
    }, 0);

    const spacing = (totalSpace - totalElementSize) / (sorted.length - 1);

    let currentPosition = type === 'horizontal' ? first.position.x : first.position.y;

    return sorted.map(element => {
      const newPosition = { ...element.position };

      if (type === 'horizontal') {
        newPosition.x = currentPosition;
        currentPosition += element.size.width + spacing;
      } else {
        newPosition.y = currentPosition;
        currentPosition += element.size.height + spacing;
      }

      return {
        ...element,
        position: newPosition
      };
    });
  }

  static findSnapGuides(
    movingElement: AlignableElement,
    otherElements: AlignableElement[],
    threshold: number = 5
  ): SnapGuide[] {
    const guides: SnapGuide[] = [];
    const movingBounds = this.getBounds(movingElement);
    const movingCenter = this.getCenter(movingBounds);

    otherElements.forEach(other => {
      const otherBounds = this.getBounds(other);
      const otherCenter = this.getCenter(otherBounds);

      if (Math.abs(movingBounds.x - otherBounds.x) < threshold) {
        guides.push({ type: 'vertical', position: otherBounds.x, source: other.id });
      }

      if (Math.abs(movingCenter.x - otherCenter.x) < threshold) {
        guides.push({ type: 'vertical', position: otherCenter.x, source: other.id });
      }

      if (Math.abs(movingBounds.x + movingBounds.width - (otherBounds.x + otherBounds.width)) < threshold) {
        guides.push({ type: 'vertical', position: otherBounds.x + otherBounds.width, source: other.id });
      }

      if (Math.abs(movingBounds.y - otherBounds.y) < threshold) {
        guides.push({ type: 'horizontal', position: otherBounds.y, source: other.id });
      }

      if (Math.abs(movingCenter.y - otherCenter.y) < threshold) {
        guides.push({ type: 'horizontal', position: otherCenter.y, source: other.id });
      }

      if (Math.abs(movingBounds.y + movingBounds.height - (otherBounds.y + otherBounds.height)) < threshold) {
        guides.push({ type: 'horizontal', position: otherBounds.y + otherBounds.height, source: other.id });
      }
    });

    return guides;
  }

  static snapToGuides(
    element: AlignableElement,
    guides: SnapGuide[]
  ): AlignableElement {
    if (guides.length === 0) return element;

    const newPosition = { ...element.position };
    const bounds = this.getBounds(element);
    const center = this.getCenter(bounds);

    guides.forEach(guide => {
      if (guide.type === 'vertical') {
        if (Math.abs(bounds.x - guide.position) < 5) {
          newPosition.x = guide.position;
        } else if (Math.abs(center.x - guide.position) < 5) {
          newPosition.x = guide.position - bounds.width / 2;
        } else if (Math.abs(bounds.x + bounds.width - guide.position) < 5) {
          newPosition.x = guide.position - bounds.width;
        }
      } else {
        if (Math.abs(bounds.y - guide.position) < 5) {
          newPosition.y = guide.position;
        } else if (Math.abs(center.y - guide.position) < 5) {
          newPosition.y = guide.position - bounds.height / 2;
        } else if (Math.abs(bounds.y + bounds.height - guide.position) < 5) {
          newPosition.y = guide.position - bounds.height;
        }
      }
    });

    return {
      ...element,
      position: newPosition
    };
  }

  static createGrid(
    canvasWidth: number,
    canvasHeight: number,
    gridSize: number = 10
  ): { vertical: number[]; horizontal: number[] } {
    const vertical: number[] = [];
    const horizontal: number[] = [];

    for (let x = 0; x <= canvasWidth; x += gridSize) {
      vertical.push(x);
    }

    for (let y = 0; y <= canvasHeight; y += gridSize) {
      horizontal.push(y);
    }

    return { vertical, horizontal };
  }

  static snapToGrid(element: AlignableElement, gridSize: number): AlignableElement {
    return {
      ...element,
      position: {
        x: Math.round(element.position.x / gridSize) * gridSize,
        y: Math.round(element.position.y / gridSize) * gridSize
      }
    };
  }

  static matchSize(
    elements: AlignableElement[],
    dimension: 'width' | 'height' | 'both'
  ): AlignableElement[] {
    if (elements.length < 2) return elements;

    const reference = elements[0];

    return elements.map(element => {
      const newSize = { ...element.size };

      if (dimension === 'width' || dimension === 'both') {
        newSize.width = reference.size.width;
      }

      if (dimension === 'height' || dimension === 'both') {
        newSize.height = reference.size.height;
      }

      return {
        ...element,
        size: newSize
      };
    });
  }

  static arrangeInGrid(
    elements: AlignableElement[],
    columns: number,
    spacing: number = 10,
    startPosition: Position = { x: 0, y: 0 }
  ): AlignableElement[] {
    return elements.map((element, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;

      return {
        ...element,
        position: {
          x: startPosition.x + col * (element.size.width + spacing),
          y: startPosition.y + row * (element.size.height + spacing)
        }
      };
    });
  }

  static constrainToBounds(element: AlignableElement, bounds: Bounds): AlignableElement {
    const newPosition = { ...element.position };

    newPosition.x = Math.max(bounds.x, Math.min(newPosition.x, bounds.x + bounds.width - element.size.width));
    newPosition.y = Math.max(bounds.y, Math.min(newPosition.y, bounds.y + bounds.height - element.size.height));

    return {
      ...element,
      position: newPosition
    };
  }
}
