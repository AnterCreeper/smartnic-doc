# Chapter 2: Architecture

## RMT Pipeline
<div align="center">
<img src="../assets/arch.png" alt="Arch" width="768">
</div>
RMT（Reconfigurable Match Table）主要由一个解析器和任意数量的匹配阶段组成。

### 解析器
可重构的解析器允许修改或添加字段定义,  并输出包头向量(PHV, Packet Header Vector），其包括一组头字段，如IP dest、Ethernet dest等。此外，包头向量包括“元数据”字段，如包到达的输入端口和其他路由器状态变量(例如，路由器队列的当前大小)。随后包头向量通过一系列逻辑匹配阶段完成包处理的逻辑单元。

### 逻辑匹配阶段

#### Table Engine

#### Match Process Unit

## 多核与共享内存
基于流水线的 RMT 显著简化了布线设计, 但存在三个重要问题：
1. 流水线每一级的表存储器是局部专用的，这意味着某一级未使用的存储器无法被另一级复用。
2. RMT 硬连线规定数据包在流水线级间传输时必须先执行匹配操作再执行动作操作, 缺乏灵活性。
3. 多模块下不易实现隔离和分配。

### 包调度器
### 网络处理核心

## Case Study
### NVIDIA BlueField-3
<div align="center">
<img src="../assets/02/dpa.webp" alt="NVIDIA DPA" width="768">
</div>

| | |
|:------------:|:----:|
| Arch | RV64IMAC |
| Cores | 16 |
| Threads | 256 |
| L1i$ | 1KiBx16 |
| L1d$ | 1KiBx256 |
| L2$ | 1.5MiBx1 |
| LLC | 3MiB |
| Clock | 1.8GHz |

### 

## Reference

- Bosshart, Pat, Glen Gibb, Hun-Seok Kim, et al. 2013. "Forwarding Metamorphosis: Fast Programmable Match-Action Processing in Hardware for SDN", SIGCOMM Comput. Commun. Rev. 43 (4): 99–110. https://doi.org/10.1145/2534169.2486011.
- Chole, Sharad, Andy Fingerhut, Sha Ma, et al. 2017. "dRMT: Disaggregated Programmable Switching", Proceedings of the Conference of the ACM Special Interest Group on Data Communication (New York, NY, USA), SIGCOMM' 17, August 7, 1–14. https://doi.org/10.1145/3098822.3098823.
- X. Chen et al., "Demystifying Datapath Accelerator Enhanced Off-path SmartNIC", 2024 IEEE 32nd International Conference on Network Protocols (ICNP), Charleroi, Belgium, 2024, pp. 1-12, https://doi.org/10.1109/ICNP61940.2024.10858560.