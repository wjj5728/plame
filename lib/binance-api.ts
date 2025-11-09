// 币安 REST API 查询函数

// 检查现货交易对是否存在
export async function checkSpotSymbolExists(symbol: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data && data.symbol === symbol.toUpperCase();
    }
    
    // 如果返回 400 或 404，说明交易对不存在
    if (response.status === 400 || response.status === 404) {
      return false;
    }
    
    // 其他错误，返回 false
    return false;
  } catch (error) {
    console.error(`Error checking spot symbol ${symbol}:`, error);
    return false;
  }
}

// 批量检查多个交易对是否存在
export async function checkSpotSymbolsExist(symbols: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  // 并发查询所有交易对
  const promises = symbols.map(async (symbol) => {
    const exists = await checkSpotSymbolExists(symbol);
    return { symbol, exists };
  });
  
  const resultsArray = await Promise.all(promises);
  
  resultsArray.forEach(({ symbol, exists }) => {
    results.set(symbol, exists);
  });
  
  return results;
}

// 获取现货交易对价格（一次性查询）
export async function getSpotPrice(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return parseFloat(data.price);
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching spot price for ${symbol}:`, error);
    return null;
  }
}

