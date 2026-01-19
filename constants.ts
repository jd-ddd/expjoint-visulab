import { JointType, JointConfig } from './types';

export const JOINT_DATA: JointConfig[] = [
  {
    id: JointType.AXIAL,
    name: '单式轴向膨胀节 (Single Axial)',
    description: '最简单的膨胀节类型。设计用于吸收安装管道部分的轴向运动（压缩和拉伸）。',
    allowedDeformation: { axial: true, lateral: false, angular: false },
    features: ['成本低', '设计简单', '需要强力固定支架', '无法吸收横向位移']
  },
  {
    id: JointType.LATERAL,
    name: '复式/横向膨胀节 (Universal)',
    description: '由两个波纹管和中间接管组成。设计用于吸收除轴向运动外的大量横向偏转。',
    allowedDeformation: { axial: true, lateral: true, angular: false },
    features: ['吸收大横向位移', '可吸收轴向运动', '拉杆可承受压力推力']
  },
  {
    id: JointType.HINGED,
    name: '铰链膨胀节 (Hinged)',
    description: '包含单个波纹管，设计用于通过铰链板上的一对销轴，仅允许在一个平面内进行角向旋转。',
    allowedDeformation: { axial: false, lateral: false, angular: true },
    features: ['吸收角向旋转', '承受压力推力', '通常成对或成组使用']
  },
  {
    id: JointType.GIMBAL,
    name: '万向铰链膨胀节 (Gimbal)',
    description: '设计用于通过固定在公共浮动万向环上的两对铰链，允许在任何平面内进行角向旋转。',
    allowedDeformation: { axial: false, lateral: false, angular: true },
    features: ['多平面旋转', '承受压力推力', '结构坚固']
  }
];

export const MAX_AXIAL_MM = 50;
export const MAX_LATERAL_MM = 40;
export const MAX_ANGULAR_DEG = 15;