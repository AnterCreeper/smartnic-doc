# Chapter 1: Introduction

## New Era of Network

随着计算机应用程序的发展，催生出了众多新的模式，这些趋势要求着计算机系统的与时俱进发展以适应新的计算形态。
#### 云计算:
互联网已经成为基础设施，用户可以随时订阅一些云计算资源，数据中心灵活地按需提供给用户包括计算、存储、网络、数据库等算力形态。
 - 网络加速: 虚拟机网络虚拟化，硬件的网卡需要虚拟化为无数个虚拟的逻辑网卡接入到一个个虚拟机，并为这些虚拟的逻辑网卡接入到相应的网络，完成对网络交换和管理功能的硬件卸载。
<div align="center">
<image src="https://github.com/AnterCreeper/smartnic/blob/main/pic/1.png?raw=true" alt="Open vSwitch Diagram" width="384">
</div>
 
 - 存储虚拟化: 诞生了 SAN 架构存算分离，云计算厂商将存储集中池化，以实现集中管理和分配，具有更高的灵活性和扩展性。计算节点通过网络远程访问存储池(如 NVME-oF)，需要硬件卸载以减少 CPU 开销。
<div align="center">
<image src="https://github.com/AnterCreeper/smartnic/blob/main/pic/2.jpg?raw=true" alt="SAN Diagram" width="512">
</div>
 
#### 高性能网络:
1. 随着网络带宽需求日益增加，TCP 网络的系统开销严重，通过将内核对网络的管理下沉到网卡，从而用户态直接操纵硬件，解放 CPU 的负担。
2. 随着加速器的发展，计算机系统内部总线向外衍生，
 - RDMA: 在高性能计算和数据中心网络领域，通常使用 RDMA 技术以完成科学计算、数据库、存储等负载。用户空间程序之间直接完成对对方远端内存的 `Read`/`Write`/`Atomic` 操作。
 - DPDK: 将传统的网卡收到数据包通过内核态处理的流程(例如 TCP/IP 协议栈)转移到了用户态处理，用户空间通过 VFIO 直接访问网卡硬件，减少了CPU处理中断和上下文切换的额外开销，能够使CPU得到更高效
  的利用，可实现对各类传统网络应用(如各类面向广域网的应用，例如 HTTP)的加速。

#### 其他：
1. 随着网络请求的日益增加，管理需求受到关注，如DDoS 防护、负载均衡和流量过滤，大量的流量对系统性能提出了挑战。
- eXpress Data Path(XDP) 运行在比传统 Linux 网络组件更低的层级，通过将 eBPF 程序直接附加到网络设备驱动程序上，在数据包被内核标准网络栈处理之前拦截并处理它们，从而实现了极低延迟和高效的数据包处理。
- 将这些管理程序下沉卸载到智能网卡，实现高效的硬件加速。

2. VPN 隧道技术(如 WireGuard、IPSec等)通过加密实现了广域网的私密通道，保护传输的信息不被拦截和未经授权的访问，从而实现广域网上构建一套虚拟的安全可信私网，可满足用户对企业、校园等组织的内部私有设施的访问。  
3. ZeroTrust 零信任模式，通过在代理主机和服务器之间构建私密隧道实现内网穿透，可对所需组织内部设施广域网暴露和互相隔离。相比于传统的 VPN 和防火墙技术信任安全私网"城堡"内的所有人和设备，Zero Trust 不信任任何人，并且试图访问网络资源的每一个人都需要通过代理主机并经过验证。
- 隧道的加密解密算法与封包/解包需要大量算力，而硬件智能网卡处理芯片具有强大的处理能力。

## Category of SmartNIC Architecture

1. Basic NIC (obsoleted)
 - 仅负责将物理层的光/电信号转换为数字信号，通过 PCIe 传给 CPU。
 - 所有的功能(如协议栈、校验码计算)都由 host CPU 处理。
 - 随着进入 1Gbps 时代，CPU 处理网络包的开销变得不可接受(基于当时的 CPU 处理性能)。

2. Offload NIC (ASIC based SmartNIC)
 - 将特定的、固定的网络功能卸载到网卡硬件中。
 - 诞生了一些简单的硬件加速功能，如 TSO、Checksum offload、LSO/LRO (分段/重组)等。
 - 一些更为高级的网卡(如 Mellanox ConnectX-5)配备了一些略复杂的功能(如网卡虚拟化与 OvS，存储加速等)，应用可以对功能进行一些简单的管理。
 - 网卡以 ASIC 架构为主(类似于早期显卡的固定渲染管线)，结构简单性能高。
 - 功能固化，基本没什么编程能力。无法适应软件定义网络（SDN）快速变化的协议需求。
 
3. 独立可编程智能网卡 (FPGA based Programmable SmartNIC)
 - 所有的基础设施任务（网络、存储、安全、SDN）全部从 Host CPU 剥离并运行于网卡上。
 - 搭载的 FPGA 允许用户编程数据平面的处理逻辑, 如实现 Crypto/Compression/RAID 等功能的卸载。

4. Soc可编程智能网卡 (DPU)
 - 虽然 ASIC 具有成本效益和最优性价比，但其灵活性有限。相比之下，基于现场可编程门阵列（FPGA）的 SmartNIC 具有极高的可编程性。
 - 只要有足够的时间、精力和专业知识，几乎可以在 FPGA 上可用的门电路范围内高效实现任何功能。然而，FPGA 以编程难度大和成本高而著称，需要花费非常多的人力和时间。
 - 通过集成 ASIC / FPGA 和 CPU 提供了一种平衡的解决方案。
 
| Architecture | Cost | Programmable | Flexibility | Performance | Product |
|:------------:|:----:|:------------:|:-----------:|:-----------:|:-------:|
| ASIC | <font color=green>Low</font> | <font color=red>Low</font> | <font color=red>Low</font> | <font color=green>High</font> | Mellanox ConnectX-5 |
| FPGA | <font color=red>High</font> | <font color=green>High</font> | <font color=gold>Medium</font> | <font color=green>High</font> | Xilinx Alevo U50, Cisco Nexus, Alibaba CIPU, Microsoft Catapult |
| ASIC + FPGA | <font color=red>High</font> | <font color=gold>Medium</font> | <font color=gold>Medium</font> | <font color=green>High</font> | Mellanox Innova-2 Flex |
| CPU + FPGA | <font color=red>High</font> | <font color=green>High</font> | <font color=red>High</font> | <font color=gold>Medium</font> | Xilinx Alveo U25N, Intel SmartNIC N6000 |
| CPU + ASIC | <font color=gold>Medium</font> | <font color=red>Low</font> | <font color=red>High</font> | <font color=gold>Medium</font> | Pensando, NVIDIA BlueField, Netronome Agilio, Intel IPU(Google), Broadcom Stingray... |

## Category of SmartNIC 

1. On-Path SmartNICs

2. Off-Path SmartNICs

## Development Tools and Frameworks

## Reference

 - E. F. Kfoury, S. Choueiri, A. Mazloum, A. AlSabeh, J. Gomez, and J. Crichigno, "A comprehensive survey on smartNICs: Architectures, development models, applications, and research directions", IEEE Access, vol. 12, pp. 107297–107336, 2024.
 
