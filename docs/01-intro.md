# Chapter 1: Introduction

## New Era of Network

随着计算机应用程序的发展，催生出了众多新的模式，这些趋势要求着计算机系统的与时俱进发展以适应新的计算形态。

#### 高性能网络
1. 随着互联网进入高速发展阶段，线上业务和用户规模的不断增加，给计算机系统的承载能力带来了很大挑战。IO 总线性能进展缓慢，成为了系统瓶颈。    
为了满足性能需求，数据中心搭载了大量计算机组成的集群，数据中心内和数据中心间需要高性能网络以满足集群间计算机通讯的需要，计算机系统总线向外衍生。
2. `InfiniBand` 支持高速低延迟的互联。然而，随着以太网的蓬勃发展，为了避免在数据中心构建两套网络的负担，人们转向通过以太网承载这些功能(e.g. `RoCE`, `NVMe over RoCE`)。
<div align="center">
<img src="../assets/infiniband.webp" alt="Infiniband Diagram" width="512">
</div>

 - RDMA: 在高性能计算和数据中心网络领域，通常使用 RDMA 技术以完成科学计算、数据库、存储等负载。用户空间程序之间直接完成对对方远端内存的 `Read`/`Write`/`Atomic` 操作。
 - DPDK: 将传统的网卡收到数据包通过内核态处理的流程(例如 TCP/IP 协议栈)转移到了用户态处理，用户空间通过 VFIO 直接访问网卡硬件，减少了 CPU 处理中断和上下文切换的额外开销，能够使CPU得到更高效的利用，可实现对各类传统网络应用(如各类面向广域网的应用，例如 HTTP)的加速。

#### 云计算
互联网已经成为基础设施，用户可以随时订阅一些云计算资源，数据中心灵活地按需提供给用户包括计算、存储、网络、数据库等算力形态。
 - 网络加速: 虚拟机网络虚拟化，硬件的网卡需要虚拟化为无数个虚拟的逻辑网卡接入到一个个虚拟机，并为这些虚拟的逻辑网卡接入到相应的网络，完成对网络交换和管理功能的硬件卸载。
<div align="center">
<img src="../assets/ovs.png" alt="Open vSwitch Diagram" width="384">
</div>
 
 - 存储虚拟化: 云计算厂商将存储集中池化, 计算节点通过网络远程访问存储池(如 NVME-oF)，以实现集中管理和分配，具有更高的灵活性和扩展性。需要硬件卸载以减少 CPU 开销。
<div align="center">
<img src="../assets/san.jpg" alt="SAN Diagram" width="512">
</div>

#### 流量管理与加密
1. 随着网络请求的日益增加，管理需求受到关注，如 DDoS 防护、负载均衡和流量过滤，大量的流量对系统性能提出了挑战。
- eXpress Data Path(XDP) 运行在比传统 Linux 网络组件更低的层级，通过将 eBPF 程序直接附加到网络设备驱动程序上，在数据包被内核标准网络栈处理之前拦截并处理它们，从而实现了极低延迟和高效的数据包处理。
- 将这些 eBPF 程序直接下沉卸载到智能网卡，可实现高效的硬件加速。

2. VPN 隧道技术(如 WireGuard, IPSec 等)通过加密实现了广域网的私密通道，保护传输的信息不被拦截和未经授权的访问，从而实现广域网上构建一套虚拟的安全可信私网，可满足用户对企业、校园等组织的内部私有设施的访问。  
3. ZeroTrust 零信任模式，通过在代理主机和服务器之间构建私密隧道实现内网穿透，可对所需组织内部设施广域网暴露和互相隔离。相比于传统的 VPN 和防火墙技术信任安全私网"城堡"内的所有人和设备，Zero Trust 不信任任何人，并且试图访问网络资源的每一个人都需要通过代理主机并经过验证。
- 隧道的加密解密算法与封包/解包需要大量算力，而硬件智能网卡处理芯片具有强大的处理能力。

## Category of Architecture
智能网卡的体系结构发展也经历了如同 GPU 一样的: 从固定管线、可编程管线，到异构计算系统的过程。
<div align="center">
<img src="../assets/history.png" alt="NIC History" width="512">
</div>

#### Foundational NIC (obsoleted)
 - 仅负责将物理层的光/电信号转换为数字信号，通过 PCIe 传给 CPU。
 - 所有的功能(如协议栈、校验码计算)都由 host CPU 处理。
 - 随着进入 1Gbps 时代，CPU 处理网络包的开销变得不可接受(基于当时的 CPU 处理性能)。

#### Offload NIC
 - 将一些特定的网络功能卸载到网卡硬件中，如 TSO、Checksum offload、LSO/LRO (分段/重组)等。
 - 一些更为高级的网卡(如 Mellanox ConnectX-5)配备了一些略复杂的功能(如网卡虚拟化与 OvS，存储加速等)，应用可以对功能进行一些简单的管理。
 - 网卡以 ASIC 架构为主，结构简单性能高。网络协议和功能固化，基本没什么编程能力。
 - One size never fits all. 采用软件定义的方法能够推动针对场景的网络快速开发、部署与优化，而 ASIC 的长开发周期无法适应软件定义网络（SDN）快速变化的需求。
 
#### 独立可编程智能网卡 (Discrete Programmable SmartNIC)
 - 所有的基础设施任务（网络、存储、安全、SDN）全部从 Host CPU 剥离并运行于网卡上。
 - 搭载的 FPGA 允许用户编程数据平面的处理逻辑, 如实现 Crypto(e.g. SSL/TLS, SHA)/Compression(e.g. GZIP)/RAID/... 等较为复杂功能的卸载。
 - 网卡中数据包处理逻辑通常不是最大的消耗部分。相反, 资源大小通常由 SRAM 构建的 Buffer, 收发器和驱动这些接口的逻辑(如以太网 MAC + PCS, PCIe 控制器、DRAM 控制器)控制。
 - 只要有足够的时间、精力和专业知识，几乎可以在 FPGA 上可用的门电路范围内高效实现任何功能。然而，FPGA 以编程难度大和成本高而著称，需要花费非常多的人力和时间。
> FPGA 开发的 10/100/1000 准则: 10 years workload; no more than 100 lines; at least 1000 machines;
  
#### Soc可编程智能网卡 (DPU)
 - 通过集成 ASIC / FPGA 和 CPU 为此提供了一种平衡的解决方案。SoC 方案集成了独立的内存和存储组件，有的还配备了丰富的硬化加速器，可以高效地支持更为复杂的网内计算功能。
<div align="center">
<img src="../assets/pensando.png" alt="SoC Diagram" width="384">
</div>
<div align="center">
<img src="../assets/dpu.png" alt="CPU+FPGA Diagram" width="512">
</div>

| Architecture | Cost | Programmable | Flexibility | Performance | Product |
|:------------:|:----:|:------------:|:-----------:|:-----------:|:-------:|
| ASIC | <font color=green>Low</font> | <font color=red>Low</font> | <font color=red>Low</font> | <font color=green>High</font> | Mellanox ConnectX-5 |
| FPGA | <font color=red>High</font> | <font color=green>High</font> | <font color=gold>Medium</font> | <font color=green>High</font> | Xilinx Alevo U50, Cisco Nexus, Alibaba CIPU, Microsoft Catapult |
| ASIC + FPGA | <font color=red>High</font> | <font color=gold>Medium</font> | <font color=gold>Medium</font> | <font color=green>High</font> | Mellanox Innova-2 Flex |
| CPU + FPGA | <font color=red>High</font> | <font color=green>High</font> | <font color=red>High</font> | <font color=gold>Medium</font> | Xilinx Alveo U25N, Intel SmartNIC N6000 |
| CPU + ASIC | <font color=gold>Medium</font> | <font color=red>Low</font> | <font color=red>High</font> | <font color=gold>Medium</font> | Pensando, NVIDIA BlueField, Netronome Agilio, Intel IPU(Google), Broadcom Stingray... |

## Category of Mechanism
<div align="center">
<img src="../assets/on_off_path.png" alt="Mechanism Compare" width="512">
</div>

#### On-Path SmartNICs
 - 网卡会根据匹配动作表(Match Action Table)匹配和调度，将包分配至核心(或经由可编程流水线)，处理沿通信路径传播的每个数据包。
 - On-Path 可支持最新的拥塞控制算法和网络协议。
 - 如果微码程序本体过大或执行时间过长，可能会导致发送到主机的常规网络请求性能显著下降。此外，由于使用了低级 API，编程具有挑战性。
#### Off-Path SmartNICs
 - 在数据平面旁集成大型计算核心和内存，并运行通用操作系统(如 Linux)。卸载的代码置于网络处理流水线的关键路径之外。
 - 核心通过专用接口与网卡核心和主机相连，通过网卡上嵌入式交换机的转发规则将需要操作的流量转发至核心进行处理。
 - 支持完整内核和网络协议栈，支持复杂的卸载操作，编程复杂度低。
 - 相比 On-Path 引入了较高额外的延迟，逐包处理性能不佳，但影响范围只发生在卸载的网络流量。
#### 混合方案  
通过同时集成 Off-Path 的少数大型 CPU 核心和 On-Path 的大量包处理小核的异构架构以同时支持不同复杂度的加速功能。
- 快路径经由 On-Path 处理器，用于处理简单高性能的逻辑
- 慢路径经由 Off-Path 处理器(以及 DSA 专用加速器, e.g. LZ77, Crypto)，用于处理较为复杂的逻辑
> 为什么慢路径不可以直接发送至 CPU 经由操作系统/DPDK 协议栈处理? 个人观点: 其一是计算机系统总线(e.g. PCIE)和网络之间巨大的性能鸿沟造成的——在网络高歌猛进的同时，系统总线的发展依然止步不前，从而造成巨大的带宽和延迟的瓶颈。其二是 CPU 处理器 "通用" 的桎梏, 在内存系统的取舍上更多的选择了加大内存容量，而其内存带宽较为宝贵。
<div align="center">
<img src="../assets/bf3_arch.png" alt="BF3 Diagram" width="512">
</div>

## Development Kit

## Case Study
### Commercial
#### NVIDIA BlueField-3
<div align="center">
<img src="../assets/dpa.webp" alt="NVIDIA DPA" width="512">
</div>

### Academic (Open Source)

1. Xilinx OpenNIC

2. UCSD Sysnet Corundum


## Reference

 - E. F. Kfoury, S. Choueiri, A. Mazloum, A. AlSabeh, J. Gomez, and J. Crichigno, "A comprehensive survey on smartNICs: Architectures, development models, applications, and research directions", IEEE Access, vol. 12, pp. 107297–107336, 2024.
 - X. Chen et al., "Demystifying Datapath Accelerator Enhanced Off-path SmartNIC," 2024 IEEE 32nd International Conference on Network Protocols (ICNP), Charleroi, Belgium, 2024, pp. 1-12, doi: 10.1109/ICNP61940.2024.10858560.
 - Pat Bosshart, Glen Gibb, Hun-Seok Kim, George Varghese, Nick McKeown, Martin Izzard, Fernando Mujica, and Mark Horowitz, "Forwarding metamorphosis: fast programmable match-action processing in hardware for SDN", SIGCOMM Comput. Commun. Rev. 43, 4 (October 2013), 99–110. https://doi.org/10.1145/2534169.2486011
- Pat Bosshart, Dan Daly, Glen Gibb, Martin Izzard, Nick McKeown, Jennifer Rexford, Cole Schlesinger, Dan Talayco, Amin Vahdat, George Varghese, and David Walker, "P4: programming protocol-independent packet processors", SIGCOMM Comput. Commun. Rev. 44, 3 (July 2014), 87–95. https://doi.org/10.1145/2656877.2656890