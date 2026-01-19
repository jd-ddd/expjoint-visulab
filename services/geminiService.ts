import { GoogleGenAI } from "@google/genai";
import { JointConfig, SimulationState } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateTechnicalAnalysis = async (
  question: string,
  joint: JointConfig,
  simState: SimulationState
): Promise<string> => {
  try {
    const ai = getClient();
    const model = 'gemini-3-flash-preview';

    const prompt = `
      你是一位资深管道应力工程师和膨胀节专家。
      
      背景信息:
      用户正在仿真工具中分析 "${joint.name}"。
      当前仿真状态:
      - 轴向变形: ${simState.axial}%
      - 横向位移: ${simState.lateral}%
      - 角向旋转: ${simState.angular} 度
      - 内部压力: ${simState.pressure} bar
      
      用户问题: "${question}"
      
      请提供简洁、专业的技术解释。请用中文（简体）回答。重点关注机械应力、材料疲劳（EJMA标准）和应用建议。
      不要使用markdown标题（如 # 或 ##），如果需要强调请使用粗体。字数控制在 150 字以内。
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "未生成回复。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "抱歉，我暂时无法访问技术数据库。请检查您的 API 密钥配置。";
  }
};