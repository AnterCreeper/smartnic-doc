# Chapter 2: Architecture

## Adaptive Network Architecture

为了满足多变的网络应用的需要, 一方面架构需要提供卓越的性能满足应用; 另一方面, 需要提供充分的、易于使用的可编程环境, 具有更强的灵活性(适应性)，可降低开发周期和成本。

## RMT 流水线
<div align="center">
<img src="../assets/02/rmt.png" alt="RMT Diagram" width="768">
</div>

随着 SDN 网络兴起 `OpenFlow` 大火(谷歌在 B4 骨干网上部署 SDN 取得巨大成功), 而 OpenFlow 在承载 SDN 存在关键弊病: 当时的硬件交换机电路逻辑仅允许在一组固定的字段上进行`匹配操作`处理, 无法支持自定义协议的解析。

为了增强交换机的可编程性并充分利用流水技术和并行以提升速度, 提出了 `RMT`(Reconfigurable Match Table), 将 OpenFlow 中逻辑匹配(`Match-Action`)的抽象应用到报文协议解析中, 以支持逐包自定义的协议解析。经过解析后报文经过一系列匹配阶段, 根据解析结果中的一些特定字段执行一些处理程序。

### 解析器
解析器通过 Match-Action 逐步提取报文的头部字段并循环压入并输出包头向量(`PHV`, Packet Header Vector), 实现协议解析。用户可通过配置不同的 Match-Action 表项实现自定义的协议字段提取。

包头向量由一组头字段组成, 如IP dest、Ethernet dest等。此外, 包头向量包括“元数据”字段, 如VLAN ID, 包到达的输入端口编号和其他路由器状态变量(例如, 路由器队列的当前大小)。

<div align="center">
<img src="../assets/02/parser.svg" alt="RMT Parser" width="512">
</div>

### 逻辑匹配阶段
Match-Action 阶段通常也叫 Steering。首先其接受解析器生成的包头向量, 提取用于匹配规则的关键字(Table Engine, TE)。随后根据`关键字匹配的结果`或`关键字的哈希`(精确匹配, 范围匹配, 最长前缀匹配, 三态[Ternary]匹配...), 加载并执行相应的 Action 程序(Match Process Unit, MPU)。

MPU 是专门面向数据流处理设计的核心, 支持各种复杂的操作。一段 Action 程序包含了若干条指令, 包括对 PHV 的修改、常见的算术逻辑运算、访存指令, 以及位域操作加速指令等。
<div align="center">
<img src="../assets/02/stage.svg" alt="RMT Stage" width="512">
<br /><br />
<img src="../assets/02/isa.png" alt="RMT Action" width="768">
</div>

## dRMT 多核
<div align="center">
<img src="../assets/02/ezchip.svg" alt="EzChip Diagram" width="512">
</div>

基于流水线的 RMT 显著简化了布线设计, 但存在两个重要问题:
1. 流水线每一级的表存储器是局部专用的, 这意味着某一级未使用的存储器无法被另一级复用。
2. RMT 硬连线规定数据包在流水线级间传输时必须先执行匹配操作再执行动作操作, 缺乏灵活性。

因此, 使用一个全局的存储器, 并通过片上网络(例如交叉开关)将其与逻辑匹配核心相连接是更合适的。此外, 使用一组匹配动作处理器, 而不是顺序将其连接起来。调度器根据一些策略, 将数据包发送至处理器上, 数据包将驻留在这个处理器上运行完整程序直至被处理完成后接收下一个数据包, 被称为`运行至完成`处理模型。

这种设计能够带来相当多的好处:
1. 编译器更易设计。而流水线的结构导致编译器需要进行静态调度和流表放置, 同时考虑到程序操作之间的依赖关系。
2. 存储与计算相互解耦, 从而允许以任意顺序执行匹配动作操作, 而不是像流水线那样固定顺序。
3. 共享复用大大提高了片上存储器的使用效率, 并支持对大型流表的并行查找。

然而, 这种`运行至完成`处理模型可能无法保证数据包的确定性和延迟(e.g. 缓存未命中、总线争用、Bank 冲突), 因此调度和内存系统的设计至关重要, 以尽可能避免争用情况的发生, 例如使用静态的处理结构、基于静态编译的调度、使用静态片上内存而不是高速缓存等。
<div align="center">
<img src="../assets/02/pipeline.svg" alt="Pipeline Diagram" width="512">
<br /><br />
<img src="../assets/02/manycore.svg" alt="Manycore Diagram" width="512">
</div>

> 这种架构和 Off-Path 通用处理器又有哪些区别? 如何对架构设计进行权衡?

### 流量管理器
流量管理器(Traffic Manager)与 RMT 流水线中的解析器类似, 其将输入的报文头部解码为包头向量, 并且需要根据向量信息, 将报文分发到合适的地方进行处理。

例如, 流量管理器需要管理连接状态表(QP Context Table), 根据报文所属连接分发到管理对应连接的网络处理核心或核心集群。其他的影响因素还有包的优先级, 负载均衡, 硬件状态(减小争用)等等。流量管理器也可以选择根据一些条件丢弃一些包, 以实现对流量的限速。

#### 可编程队列
可编程队列是构成流量管理器的核心组件: 
<!-- TODO: PIFO, PIEO, SP-PIFO -->

### 网络处理核心
面向数据流处理器, 一方面增加了包头向量处理的数据通路和位域操作的加速指令, 另一方面为了减少核心在处理来自不同流量报文的上下文切换开销, 增加了硬件层面的线程调度支持。

## Case Study
### Microsoft ClickNP

### UT NS PANIC
[https://github.com/lockkkk/PANIC](https://github.com/lockkkk/PANIC)  
PANIC 是一款新型可编程 100Gbps 网卡, 可提供跨租户性能隔离和跨并行卸载引擎的低延迟负载均衡, 能够随着线速的提高而扩展, 从而支持大量的卸载功能和较长的卸载链。
<div align="center">
<img src="../assets/02/panic.png" alt="PANIC Diagram" width="512">
</div>

PANIC 主要分为四个部分:
- RMT 流水线: 一个简单的 RMT 流水线, 包括可编程解析器(主机 CPU 通过 `MIMO` 写入)和逻辑匹配阶段(执行简单的数据包处理器, 如计算校验和)。对包进行解析生成一个变长的描述符(Descriptor), 允许数据经过依次多个计算单元。如果流量不需要卸载, 包将直接进入 `DMA` 单元传输至主机。
- 高性能交换网络
- 中央调度器: 监控卸载单元的忙碌情况(Credit Manager), 并结合描述符将包调度到空闲的核心(对于相同服务的数据可以并行卸载到同类型的多个计算单元上)或丢弃, 实现性能隔离、负载均衡和低延迟。
- 计算单元: 可以是固化或嵌入式 FPGA 构建的加速器逻辑, 也可以是由处理器核实现。

> Lin, Jiaxin, Kiran Patel, Brent E. Stephens, Anirudh Sivaraman, and Aditya Akella, "PANIC: A High-Performance Programmable NIC for Multi-Tenant Networks", OSDI 2020, 243–59. https://www.usenix.org/conference/osdi20/presentation/lin

### Netronome Agilio NFP-4000
<div align="center">
<img src="../assets/02/agilio.png" alt="Agilio Diagram" width="768">
<table><tr>
<td><img src="../assets/02/agilio0.svg" alt="Arch Diagram" width="256"></td>
<td><img src="../assets/02/agilio1.svg" alt="Flow Diagram" width="512"></td>
</tr></table>
</div>

#### 包处理核

#### 流处理核
FPC(Flow Processing Cores) 是一个 32 位具有 CRC 硬件加速的 RISC 核心, 主频 800MHz, 具有 8 个线程上下文, 但一次最多只能运行一个线程。虽然 FPC 具有强大的数据流处理能力, 但其代码存储空间较小, 缺少定时器, 并且不支持浮点操作等复杂的计算。

Agilio 系统增加了逐连接的匹配机制, 包含一个精确匹配流跟踪缓存(EMFC)用于跟踪通过系统的每个流。出入口包处理器 PPC 对数据包头进行解析, 其中入口端口号以及系统支持的所有包头字段可以标识出流。
当数据包包到达 FPC 岛部分, FPC 线程将进行如下步骤操作:
- 解析存储在 CTM 中的包头向量, 并提取字段。
- 查找位于 EMEM 中的 EMFC, 其中存储着所有已记录的流。
- 如果未找到条目, 数据包属于新流, FPC 将执行所有 Match-Action 程序。于此同时, FPC 将每个表(匹配字段的值, 操作 ID 和相应的参数)中的匹配条目记录下来并添加到 EMFC。
- 如果数据包头字段在 EMFC 中已经存在, FPC 将跳过对该流不必要的 Match-Action 操作。
- 最后 FPC 将经过处理的包发送, 随后处理下一个包。

| Memory | Scope | Size | Latency |
|:------:|:-----:|:----:|:-------:|
| Instruction Mem | Core | 32KiB | N/A |
| Local Mem (LM) | Core | 4KiB | 1-3 |
| Cluster Local Scratch (CLS) | Island | 64KiB | 20-50 |
| Cluster Target Mem (CTM) | Island | 256KiB | 50-100 |
| Internal Mem (IMEM) | Global | 4MiB | 150-250 |
| External Mem (EMEM) | Global | 2GiB | 150-250 |

FPC 与指令存储器和五层数据存储器交互, 每一层都有其自身的作用域、大小和访问延迟。
具体来说, 由于 IMEM 和 EMEM 是全局可用的, 我们利用它们来存储所有 FPC 共享的变量, 例如锁、计数器和全局状态。FPC 依赖内存引擎 (ME) 来执行读写操作。内存引擎有两种类型: 批量内存引擎和原子内存引擎。IMEM 和 EMEM 各自拥有独立的内存引擎。

FPC 同时支持 P4 和 Micro-C 语言编程。FPC 程序与典型的 P4 程序类似, 程序员可以使用 P4 语言定义程序头、解析器和匹配字段; 对于操作, 程序员通常则使用 Micro-C 语言以获得更好的灵活性。

### NVIDIA BlueField-3 DPA
<div align="center">
<img src="../assets/02/dpa.webp" alt="NVIDIA DPA Diagram" width="768">
</div>

与 NFP-4000 类似, NVIDIA BF-3 DPA 采用了类似的设计: 大量的面向数据流处理的小型 RISC 核心(16个 RV64IMAC RISC-V 核心, 运行在 1.8GHz 下), 每个核心具备大量的硬件线程上下文管理(16个线程)。然而, 与简单的 On-Path 智能网卡不同，DPA 的设计使其能够与 ARM 和主机相关资源紧密交互。

#### RTOS
DPA 上装载了一个实时操作系统(RTOS), 支持多进程和多线程, 每个线程可以通过硬件的调度映射到不同的执行单元从而实现并行执行。这些进程的执行上下文是隔离的, 即在各自的地址空间内运行, 操作系统负责在不同进程之间实施特权和隔离。与许多其他实时操作系统一样, 用户空间栈的大小有限(8184 Bytes), 用户有责任确保程序不会分配超出栈限制的内存。

RTOS 采用协同运行至完成(cooperative run-to-completion)的调度模型。在协同调度下, 执行处理程序可以在不中断的情况下使用执行单元, 直至其放弃该单元。一旦放弃, 执行单元将交还给 RTOS 以调度下一个处理程序。RTOS 为处理程序设置了一个看门狗, 以防止任何处理程序过度占用执行单元。

#### Memory
<div align="center">
<img src="../assets/02/dpa_mem.svg" alt="DPA Memory Hierarchy" width="512">
</div>

更大的差异体现在内存系统上, DPA 核心采用了多级缓存的设计: DPA 内存访问经过三个级别的缓存。每个执行单元都有一个私有的 L1 数据缓存, 而 L1 代码缓存由 DPA 核心中的所有执行单元共享。L2 缓存由所有 DPA 核心共享。这种复杂的缓存/内存层次结构叠加上每个线程较小的缓存容量, 可能使得程序员难以充分发挥数据通路加速器增强型异路智能网卡的潜力: 程序员需要经过精心的内存工程, 以保证热点数据和程序命中, 减少对性能的影响。

DPA 内核没有直接连接的内存, 而是在 ARM 核心的内存中专门分配了一个 1 GiB 的区域供其使用。DPA 必须通过网卡交换机访问这部分内存区域，从而导致了很高的延迟。除了 DPA 内存之外，DPA 还可以通过内存通道模块(Memory Apertures), 其将将内存请求转换为 PCIe 事务从而实现对主机内存和 ARM 内存的访问。并且值得注意的是，此类访问只会经过 DPA 的 L1 缓存。当然, 引入缓存随之引申出来的是一致性问题: DPA 提供了一个弱一致性内存模型。应用程序需要使用`Fence`指令以强制执行所需的内存顺序。此外, 在一些情况下应用程序需要将数据写回, 以使数据对 NIC 引擎可见。
<div align="center">
<img src="../assets/02/dpa_lat.svg" alt="DPA Memory Latency" width="512">
<img src="../assets/02/dpa_bw.svg" alt="DPA Memory Bandwidth" width="512">
</div>

根据测试, 值得注意的是, DPA 的各级缓存和内存访问都表现了极其糟糕的延迟, 从而不可避免地对应用程序卸载性能产生较大的影响。而在带宽测试中, DPA 核心也表现出较差的情况: 无论访问哪个内存, DPA 的单线程读写带宽都比主机和 ARM 核心低 205 倍。这表明 DPA 在内存密集型应用中性能可能较差。因此, 尽管 DPA 提供了更低的网络延迟，但其内存子系统和计算能力远逊于主机/ARM, 当网络应用涉及大量处理时，DPA 靠近网络的优势会被其糟糕的内存和计算性能所掩盖。

#### Conclusion
不难看出, BF-3 依然残留了大量来自 BF-2 Off-Path 的影子, 系统还只是加速核心和 CX 系列网卡的"胶水"拼接(正如过去的 Mellanox Innova-2 Flex 一样), 导致大量的请求需要经过内置的 PCIe 交换机从而引发了一些问题。

### AMD Pensendo
<!-- TODO: AMD Pensendo -->

## Reference
- Sushant Jain, Alok Kumar, Subhasree Mandal, Joon Ong, Leon Poutievski, Arjun Singh, Subbaiah Venkata, Jim Wanderer, Junlan Zhou, Min Zhu, Jon Zolla, Urs Hölzle, Stephen Stuart, and Amin Vahdat, "B4: experience with a globally-deployed software defined wan", SIGCOMM Comput. Commun. Rev. 43, 4 (October 2013), 3–14. https://doi.org/10.1145/2534169.2486019
- Pat Bosshart, Glen Gibb, Hun-Seok Kim, George Varghese, Nick McKeown, Martin Izzard, Fernando Mujica, and Mark Horowitz, "Forwarding metamorphosis: fast programmable Match-Action processing in hardware for SDN", SIGCOMM Comput. Commun. Rev. 43, 4 (October 2013), 99–110. https://doi.org/10.1145/2534169.2486011
- Wang, Tao, Xiangrui Yang, Gianni Antichi, Anirudh Sivaraman, and Aurojit Panda, "Isolation Mechanisms for High-Speed Packet-Processing Pipelines", NSDI 22, 1289–305. https://www.usenix.org/conference/nsdi22/presentation/wang-tao
- Chole, Sharad, Andy Fingerhut, Sha Ma, et al. 2017. "dRMT: Disaggregated Programmable Switching", Proceedings of the Conference of the ACM Special Interest Group on Data Communication (New York, NY, USA), SIGCOMM' 17, August 7, 1–14. https://doi.org/10.1145/3098822.3098823
- Rajath Shashidhara et al., "FlexTOE: Flexible TCP Offload with Fine-Grained Parallelism", 19th USENIX Symposium on Networked Systems Design and Implementation (NSDI 22), 87-102, https://www.usenix.org/conference/nsdi22/presentation/shashidhara
- Shaoke Xi et al., "Cora: Accelerating Stateful Network Applications with SmartNICs", arxiv, https://arxiv.org/abs/2410.22229
- Agilio OVS Software Architecture - Corigine, https://www.corigine.com.cn/UploadFiles/pdf/2021-07-22/130157340680174.pdf
- DPL System - NVIDIA Docs, https://docs.nvidia.com/doca/sdk/dpl-system/index.html
- DPA Development - NVIDIA Docs, https://docs.nvidia.com/doca/sdk/dpa-development/index.html
- X. Chen et al., "Demystifying Datapath Accelerator Enhanced Off-path SmartNIC", 2024 IEEE 32nd International Conference on Network Protocols (ICNP), Charleroi, Belgium, 2024, pp. 1-12, https://doi.org/10.1109/ICNP61940.2024.10858560